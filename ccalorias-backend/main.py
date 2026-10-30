import asyncio
import logging
import os
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import httpx
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from jose import JWTError, jwt
from models import (
    AnalisisFoto,
    MetaCaloriasActualizar,
    RegistroRespuesta,
    ResumenDiario,
    TokenRespuesta,
    UsuarioLogin,
    UsuarioRegistro,
    UsuarioRespuesta,
)
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

load_dotenv()

logger = logging.getLogger("uvicorn.error")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = client.ccalorias
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRA_MINUTOS = 60 * 24 * 7

TZ_LOCAL = ZoneInfo("America/Bogota")

TAMANO_MAXIMO_MB = 5
TAMANO_MAXIMO_BYTES = int(TAMANO_MAXIMO_MB * 1024 * 1024)


def rango_del_dia(dia: date):
    inicio = datetime.combine(dia, time.min, tzinfo=TZ_LOCAL)
    fin = inicio + timedelta(days=1)
    return inicio, fin


def detectar_tipo_imagen(datos: bytes) -> str | None:
    if datos.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if datos.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return "image/webp"
    return None


genai_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=30000),
)

PROMPT_ANALISIS = """
Identifica los alimentos visibles en esta imagen de un plato de comida.
Para cada alimento, estima la cantidad (ej. "1 taza", "150g") y las calorías aproximadas.
Suma el total de calorías del plato completo.
Si la imagen no muestra comida ni bebida (por ejemplo una persona, un objeto o un paisaje),
responde con contiene_comida en false, alimentos como lista vacía y calorias_totales en 0.
No inventes alimentos.
"""


async def generar_con_reintentos(contents, config, intentos=3):
    for intento in range(intentos):
        try:
            return await genai_client.aio.models.generate_content(
                model="gemini-3.5-flash",
                contents=contents,
                config=config,
            )
        except genai_errors.ServerError:
            if intento == intentos - 1:
                raise
            await asyncio.sleep(2 * (intento + 1))


def crear_token(usuario_id: str) -> str:
    expira = datetime.now(UTC) + timedelta(minutes=JWT_EXPIRA_MINUTOS)
    payload = {"sub": usuario_id, "exp": expira}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = jwt.decode(
            credenciales.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        usuario_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    usuario = await db.usuarios.find_one({"_id": ObjectId(usuario_id)})
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health/db")
async def check_db():
    await db.command("ping")
    return {"mongo": "conectado"}


@app.post("/auth/register", response_model=UsuarioRespuesta)
async def registrar_usuario(usuario: UsuarioRegistro):
    existente = await db.usuarios.find_one({"email": usuario.email})
    if existente:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    password_hash = pwd_context.hash(usuario.password)
    nuevo_usuario = {
        "email": usuario.email,
        "password_hash": password_hash,
        "meta_calorias_diaria": usuario.meta_calorias_diaria,
    }
    resultado = await db.usuarios.insert_one(nuevo_usuario)

    return UsuarioRespuesta(
        id=str(resultado.inserted_id),
        email=usuario.email,
        meta_calorias_diaria=usuario.meta_calorias_diaria,
    )


@app.post("/auth/login", response_model=TokenRespuesta)
async def login_usuario(datos: UsuarioLogin):
    usuario = await db.usuarios.find_one({"email": datos.email})
    if not usuario or not pwd_context.verify(datos.password, usuario["password_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = crear_token(str(usuario["_id"]))
    return TokenRespuesta(access_token=token)


@app.post("/analisis/foto", response_model=AnalisisFoto)
async def analizar_foto(
    foto: UploadFile = File(...),
    usuario: dict = Depends(get_usuario_actual),
):
    imagen_bytes = await foto.read(TAMANO_MAXIMO_BYTES + 1)

    if len(imagen_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="El archivo está vacío, selecciona una foto",
        )

    tipo_imagen = detectar_tipo_imagen(imagen_bytes)
    if tipo_imagen is None:
        raise HTTPException(
            status_code=415,
            detail="El archivo no es una imagen válida, usa una foto JPG, PNG o WebP",
        )

    if len(imagen_bytes) > TAMANO_MAXIMO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"La imagen es demasiado grande, el máximo es {TAMANO_MAXIMO_MB} MB",
        )

    try:
        respuesta = await generar_con_reintentos(
            contents=[
                types.Part.from_bytes(data=imagen_bytes, mime_type=tipo_imagen),
                PROMPT_ANALISIS,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalisisFoto,
            ),
        )
    except genai_errors.ClientError as e:
        codigo = getattr(e, "code", None)
        if codigo == 429:
            raise HTTPException(
                status_code=429,
                detail="Se superó el límite de uso del servicio de análisis, intenta de nuevo más tarde",
                headers={"Retry-After": "60"},
            )
        if codigo == 400 and "api key" not in str(e).lower():
            raise HTTPException(
                status_code=422,
                detail="No se pudo procesar la imagen, intenta con otra foto",
            )
        logger.error("Error de Gemini (%s): %s", codigo, e)
        raise HTTPException(
            status_code=503,
            detail="El servicio de análisis no está disponible en este momento",
        )
    except genai_errors.ServerError:
        raise HTTPException(
            status_code=503,
            detail="El servicio de análisis está saturado, intenta de nuevo en un momento",
        )
    except httpx.TransportError:
        raise HTTPException(
            status_code=504,
            detail="El servicio de análisis no respondió a tiempo, revisa tu conexión e intenta de nuevo",
        )

    try:
        analisis = AnalisisFoto.model_validate_json(respuesta.text)
    except ValueError:
        logger.error("Respuesta inesperada de Gemini: %r", respuesta.text)
        raise HTTPException(
            status_code=502,
            detail="El servicio de análisis devolvió una respuesta inválida, intenta de nuevo",
        )

    if not analisis.contiene_comida or not analisis.alimentos:
        raise HTTPException(
            status_code=422,
            detail="No se detectó comida en la foto, intenta con otra imagen",
        )

    await db.registros_comida.insert_one(
        {
            "usuario_id": usuario["_id"],
            "foto_url": None,
            "calorias_estimadas": analisis.calorias_totales,
            "alimentos_detectados": [a.model_dump() for a in analisis.alimentos],
            "fecha_hora": datetime.now(UTC),
        }
    )

    return analisis


@app.get("/registros", response_model=list[RegistroRespuesta])
async def listar_registros(
    fecha: date | None = None,
    usuario: dict = Depends(get_usuario_actual),
):
    dia = fecha or datetime.now(TZ_LOCAL).date()
    inicio, fin = rango_del_dia(dia)

    cursor = db.registros_comida.find(
        {
            "usuario_id": usuario["_id"],
            "fecha_hora": {"$gte": inicio, "$lt": fin},
        }
    ).sort("fecha_hora", -1)

    registros = []
    async for r in cursor:
        registros.append(
            RegistroRespuesta(
                id=str(r["_id"]),
                calorias_estimadas=r["calorias_estimadas"],
                alimentos_detectados=r["alimentos_detectados"],
                fecha_hora=r["fecha_hora"].replace(tzinfo=UTC),
            )
        )
    return registros


@app.get("/resumen/hoy", response_model=ResumenDiario)
async def resumen_hoy(usuario: dict = Depends(get_usuario_actual)):
    hoy = datetime.now(TZ_LOCAL).date()
    inicio, fin = rango_del_dia(hoy)

    pipeline = [
        {
            "$match": {
                "usuario_id": usuario["_id"],
                "fecha_hora": {"$gte": inicio, "$lt": fin},
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$calorias_estimadas"},
                "cantidad": {"$sum": 1},
            }
        },
    ]
    resultado = await db.registros_comida.aggregate(pipeline).to_list(1)

    consumidas = resultado[0]["total"] if resultado else 0
    cantidad = resultado[0]["cantidad"] if resultado else 0
    meta = usuario["meta_calorias_diaria"]

    return ResumenDiario(
        fecha=hoy,
        calorias_consumidas=consumidas,
        meta_calorias_diaria=meta,
        calorias_restantes=meta - consumidas,
        cantidad_comidas=cantidad,
    )


@app.patch("/usuario/meta")
async def cambiar_meta_calorias(
    datos: MetaCaloriasActualizar,
    usuario: dict = Depends(get_usuario_actual),
):
    resultado = await db.usuarios.update_one(
        {"_id": usuario["_id"]},
        {"$set": {"meta_calorias_diaria": datos.meta_calorias_diaria}},
    )

    if resultado.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    return {
        "mensaje": "Meta diaria actualizada correctamente",
        "meta_calorias_diaria": datos.meta_calorias_diaria,
    }
