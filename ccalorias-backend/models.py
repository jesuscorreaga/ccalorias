from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

# Largo mínimo de la contraseña al registrarse (si el equipo cambia el valor, se cambia solo aquí)
PASSWORD_MINIMA = 8


class UsuarioRegistro(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MINIMA)
    meta_calorias_diaria: int = 2000

    @field_validator("email")
    @classmethod
    def email_en_minusculas(cls, valor: str) -> str:
        return valor.lower()


class UsuarioRespuesta(BaseModel):
    id: str
    email: EmailStr
    meta_calorias_diaria: int


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def email_en_minusculas(cls, valor: str) -> str:
        return valor.lower()


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AlimentoDetectado(BaseModel):
    nombre: str
    cantidad_estimada: str
    calorias: int


class AnalisisFoto(BaseModel):
    contiene_comida: bool
    alimentos: list[AlimentoDetectado]
    calorias_totales: int


class RegistroRespuesta(BaseModel):
    id: str
    calorias_estimadas: int
    alimentos_detectados: list[AlimentoDetectado]
    fecha_hora: datetime


class ResumenDiario(BaseModel):
    fecha: date
    calorias_consumidas: int
    meta_calorias_diaria: int
    calorias_restantes: int
    cantidad_comidas: int


class MetaCaloriasActualizar(BaseModel):
    meta_calorias_diaria: int = Field(ge=800, le=6000)
