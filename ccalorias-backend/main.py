import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from google import genai
from google.genai import types
from jose import jwt
from models import (
    AnalisisFoto,
    TokenRespuesta,
    UsuarioLogin,
    UsuarioRegistro,
    UsuarioRespuesta,
)
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

load_dotenv()

app = FastAPI()
client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = client.ccalorias
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRA_MINUTOS = 60 * 24 * 7

genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT_ANALISIS = """
Identifica los alimentos visibles en esta imagen de un plato de comida.
Para cada alimento, estima la cantidad (ej. "1 taza", "150g") y las calorías aproximadas.
Suma el total de calorías del plato completo.
"""


@app.post("/analisis/foto", response_model=AnalisisFoto)
async def analizar_foto(foto: UploadFile = File(...)):
    imagen_bytes = await foto.read()

    respuesta = genai_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=[
            types.Part.from_bytes(data=imagen_bytes, mime_type=foto.content_type),
            PROMPT_ANALISIS,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnalisisFoto,
        ),
    )

    return AnalisisFoto.model_validate_json(respuesta.text)


def crear_token(usuario_id: str) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRA_MINUTOS)
    payload = {"sub": usuario_id, "exp": expira}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@app.post("/auth/login", response_model=TokenRespuesta)
async def login_usuario(datos: UsuarioLogin):
    usuario = await db.usuarios.find_one({"email": datos.email})
    if not usuario or not pwd_context.verify(datos.password, usuario["password_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = crear_token(str(usuario["_id"]))
    return TokenRespuesta(access_token=token)


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
