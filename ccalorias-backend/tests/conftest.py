# conftest.py: configuración que pytest carga antes de las pruebas.
# Aquí se ponen valores FALSOS para las variables que main.py lee al importarse.
# Así las pruebas unitarias no necesitan el archivo .env, ni Atlas, ni Gemini,
# y no hay secretos en el repositorio.
import os

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")  # motor no conecta al crear el cliente
os.environ.setdefault("JWT_SECRET", "secreto-solo-para-pruebas")
os.environ.setdefault("GEMINI_API_KEY", "clave-falsa-para-pruebas")
