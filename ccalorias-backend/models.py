from pydantic import BaseModel, EmailStr


class UsuarioRegistro(BaseModel):
    email: EmailStr
    password: str
    meta_calorias_diaria: int = 2000


class UsuarioRespuesta(BaseModel):
    id: str
    email: EmailStr
    meta_calorias_diaria: int


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AlimentoDetectado(BaseModel):
    nombre: str
    cantidad_estimada: str
    calorias: int


class AnalisisFoto(BaseModel):
    alimentos: list[AlimentoDetectado]
    calorias_totales: int
