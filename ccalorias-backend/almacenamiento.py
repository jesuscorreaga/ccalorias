import asyncio
import io
import logging
import os
import uuid

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

TIMEOUT_SUBIDA_SEGUNDOS = 10

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


def almacenamiento_configurado() -> bool:
    return all(
        os.getenv(variable)
        for variable in (
            "CLOUDINARY_CLOUD_NAME",
            "CLOUDINARY_API_KEY",
            "CLOUDINARY_API_SECRET",
        )
    )


def _subir(datos: bytes) -> str:
    resultado = cloudinary.uploader.upload(
        io.BytesIO(datos),
        public_id=f"ccalorias/fotos/{uuid.uuid4().hex}",
        resource_type="image",
        overwrite=False,
        timeout=TIMEOUT_SUBIDA_SEGUNDOS,
    )
    return resultado["secure_url"]


async def subir_foto(datos: bytes) -> str | None:
    if not almacenamiento_configurado():
        logger.warning("Almacenamiento de fotos sin configurar, foto_url queda en null")
        return None
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_subir, datos),
            timeout=TIMEOUT_SUBIDA_SEGUNDOS + 2,
        )
    except Exception:
        logger.exception("No se pudo subir la foto, el análisis se guarda sin foto_url")
        return None
