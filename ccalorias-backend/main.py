import os
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google import genai
from google.genai import types
from jose import JWTError, jwt
from models import (
    AnalisisFoto,
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

# --------------------------------------------------
# Aplicacion y configuracion CORS
# --------------------------------------------------

app = FastAPI(title="Ccalorias API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Base de datos
# --------------------------------------------------

mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise RuntimeError("Falta configurar MONGO_URI en el archivo .env")

client = AsyncIOMotorClient(mongo_uri)
db = client.ccalorias

# --------------------------------------------------
# Autenticacion
# --------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

bearer_scheme = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRA_MINUTOS = 60 * 24 * 7

if not JWT_SECRET:
    raise RuntimeError("Falta configurar JWT_SECRET en el archivo .env")

TZ_LOCAL = ZoneInfo("America/Bogota")

# --------------------------------------------------
# Gemini
# --------------------------------------------------

gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise RuntimeError("Falta configurar GEMINI_API_KEY en el archivo .env")

genai_client = genai.Client(api_key=gemini_api_key)

PROMPT_ANALISIS = """
Identifica los alimentos visibles en esta imagen de un plato de comida.
Para cada alimento, estima la cantidad (ej. "1 taza", "150g")
y las calorias aproximadas.
Suma el total de calorias del plato completo.
"""


# --------------------------------------------------
# Funciones auxiliares
# --------------------------------------------------


def rango_del_dia(dia: date):
    inicio = datetime.combine(
        dia,
        time.min,
        tzinfo=TZ_LOCAL,
    )
    fin = inicio + timedelta(days=1)

    return inicio, fin


def crear_token(usuario_id: str) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRA_MINUTOS)

    payload = {
        "sub": usuario_id,
        "exp": expira,
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


async def get_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = jwt.decode(
            credenciales.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        usuario_id = payload.get("sub")

        if not usuario_id or not ObjectId.is_valid(usuario_id):
            raise HTTPException(
                status_code=401,
                detail="Token invalido o expirado",
            )

        usuario = await db.usuarios.find_one({"_id": ObjectId(usuario_id)})

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token invalido o expirado",
        )

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Usuario no encontrado",
        )

    return usuario


# --------------------------------------------------
# Rutas generales
# --------------------------------------------------


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health/db")
async def check_db():
    await db.command("ping")
    return {"mongo": "conectado"}


# --------------------------------------------------
# Registro e inicio de sesion
# --------------------------------------------------


@app.post(
    "/auth/register",
    response_model=UsuarioRespuesta,
)
async def registrar_usuario(usuario: UsuarioRegistro):
    existente = await db.usuarios.find_one({"email": usuario.email})

    if existente:
        raise HTTPException(
            status_code=400,
            detail="El email ya esta registrado",
        )

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


@app.post(
    "/auth/login",
    response_model=TokenRespuesta,
)
async def login_usuario(datos: UsuarioLogin):
    usuario = await db.usuarios.find_one({"email": datos.email})

    if not usuario or not pwd_context.verify(
        datos.password,
        usuario["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Email o contrasena incorrectos",
        )

    token = crear_token(str(usuario["_id"]))

    return TokenRespuesta(access_token=token)


# --------------------------------------------------
# Analisis de fotografias
# --------------------------------------------------


@app.post(
    "/analisis/foto",
    response_model=AnalisisFoto,
)
async def analizar_foto(
    foto: UploadFile = File(...),
    usuario: dict = Depends(get_usuario_actual),
):
    if not foto.content_type or not foto.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Debes subir un archivo de imagen",
        )

    imagen_bytes = await foto.read()

    if not imagen_bytes:
        raise HTTPException(
            status_code=400,
            detail="La imagen esta vacia",
        )

    try:
        respuesta = await genai_client.aio.models.generate_content(
            model="gemini-3.5-flash",
            contents=[
                types.Part.from_bytes(
                    data=imagen_bytes,
                    mime_type=foto.content_type,
                ),
                PROMPT_ANALISIS,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalisisFoto,
            ),
        )

        analisis = AnalisisFoto.model_validate_json(respuesta.text)

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail="No se pudo analizar la imagen con Gemini",
        ) from error

    await db.registros_comida.insert_one(
        {
            "usuario_id": usuario["_id"],
            "foto_url": None,
            "calorias_estimadas": analisis.calorias_totales,
            "alimentos_detectados": [
                alimento.model_dump() for alimento in analisis.alimentos
            ],
            "fecha_hora": datetime.now(timezone.utc),
        }
    )

    return analisis


# --------------------------------------------------
# Historial de comidas
# --------------------------------------------------


@app.get(
    "/registros",
    response_model=list[RegistroRespuesta],
)
async def listar_registros(
    fecha: date | None = None,
    usuario: dict = Depends(get_usuario_actual),
):
    dia = fecha or datetime.now(TZ_LOCAL).date()
    inicio, fin = rango_del_dia(dia)

    # MongoDB guarda las fechas en UTC.
    inicio_utc = inicio.astimezone(timezone.utc)
    fin_utc = fin.astimezone(timezone.utc)

    cursor = db.registros_comida.find(
        {
            "usuario_id": usuario["_id"],
            "fecha_hora": {
                "$gte": inicio_utc,
                "$lt": fin_utc,
            },
        }
    ).sort("fecha_hora", -1)

    registros = []

    async for registro in cursor:
        fecha_hora = registro["fecha_hora"]

        # Motor normalmente entrega datetimes UTC sin tzinfo.
        if fecha_hora.tzinfo is None:
            fecha_hora = fecha_hora.replace(tzinfo=timezone.utc)

        registros.append(
            RegistroRespuesta(
                id=str(registro["_id"]),
                calorias_estimadas=registro["calorias_estimadas"],
                alimentos_detectados=registro["alimentos_detectados"],
                fecha_hora=fecha_hora,
            )
        )

    return registros


# --------------------------------------------------
# Resumen diario de calorias
# --------------------------------------------------


@app.get(
    "/resumen/hoy",
    response_model=ResumenDiario,
)
async def resumen_hoy(
    usuario: dict = Depends(get_usuario_actual),
):
    hoy = datetime.now(TZ_LOCAL).date()
    inicio, fin = rango_del_dia(hoy)

    inicio_utc = inicio.astimezone(timezone.utc)
    fin_utc = fin.astimezone(timezone.utc)

    pipeline = [
        {
            "$match": {
                "usuario_id": usuario["_id"],
                "fecha_hora": {
                    "$gte": inicio_utc,
                    "$lt": fin_utc,
                },
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
