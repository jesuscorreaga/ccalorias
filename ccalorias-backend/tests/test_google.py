import time
from types import SimpleNamespace

import pytest
from bson import ObjectId
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from google.auth import crypt
from google.auth import exceptions as google_exceptions
from google.auth import jwt as google_jwt
from google.oauth2 import id_token as google_id_token
from jose import jwt

import main

CLIENT_ID = "cliente-de-la-app.apps.googleusercontent.com"
EMISOR_GOOGLE = "https://accounts.google.com"


class ColeccionFalsa:
    def __init__(self):
        self.docs = []

    async def find_one(self, filtro, collation=None):
        email = filtro["email"].lower()
        for doc in self.docs:
            if doc["email"].lower() == email:
                return doc
        return None

    async def insert_one(self, doc):
        doc = dict(doc)
        doc["_id"] = ObjectId()
        self.docs.append(doc)
        return SimpleNamespace(inserted_id=doc["_id"])


@pytest.fixture
def usuarios(monkeypatch):
    coleccion = ColeccionFalsa()
    monkeypatch.setattr(main, "db", SimpleNamespace(usuarios=coleccion))
    monkeypatch.setattr(main, "GOOGLE_CLIENT_IDS", [CLIENT_ID])
    return coleccion


@pytest.fixture
def cliente(usuarios):
    return TestClient(main.app)


def token_de_google_simulado(monkeypatch, **datos):
    info = {"email": "ana@correo.com", "email_verified": True, **datos}
    monkeypatch.setattr(main, "verificar_token_google", lambda token: info)


def sub_del_jwt(respuesta):
    return jwt.decode(
        respuesta.json()["access_token"],
        main.JWT_SECRET,
        algorithms=["HS256"],
    )["sub"]


def test_correo_nuevo_crea_usuario_sin_contrasena(cliente, usuarios, monkeypatch):
    token_de_google_simulado(monkeypatch)

    respuesta = cliente.post("/auth/google", json={"id_token": "x"})

    assert respuesta.status_code == 200
    assert respuesta.json()["token_type"] == "bearer"
    assert len(usuarios.docs) == 1
    assert usuarios.docs[0]["email"] == "ana@correo.com"
    assert usuarios.docs[0]["password_hash"] is None
    assert usuarios.docs[0]["meta_calorias_diaria"] == 2000
    assert sub_del_jwt(respuesta) == str(usuarios.docs[0]["_id"])


def test_correo_existente_inicia_sesion_en_esa_cuenta(cliente, usuarios, monkeypatch):
    existente = ObjectId()
    usuarios.docs.append(
        {"_id": existente, "email": "Ana@Correo.com", "password_hash": "hash"}
    )
    token_de_google_simulado(monkeypatch)

    respuesta = cliente.post("/auth/google", json={"id_token": "x"})

    assert respuesta.status_code == 200
    assert len(usuarios.docs) == 1
    assert sub_del_jwt(respuesta) == str(existente)


def test_devuelve_el_mismo_tipo_de_jwt_que_login(cliente, usuarios, monkeypatch):
    usuarios.docs.append(
        {
            "_id": ObjectId(),
            "email": "ana@correo.com",
            "password_hash": main.pwd_context.hash("Clave123"),
        }
    )
    token_de_google_simulado(monkeypatch)

    por_google = cliente.post("/auth/google", json={"id_token": "x"}).json()
    por_clave = cliente.post(
        "/auth/login",
        json={"email": "ana@correo.com", "password": "Clave123"},
    ).json()

    claims_google = jwt.decode(
        por_google["access_token"], main.JWT_SECRET, algorithms=["HS256"]
    )
    claims_clave = jwt.decode(
        por_clave["access_token"], main.JWT_SECRET, algorithms=["HS256"]
    )
    assert por_google.keys() == por_clave.keys()
    assert por_google["token_type"] == por_clave["token_type"] == "bearer"
    assert claims_google.keys() == claims_clave.keys() == {"sub", "exp"}
    assert claims_google["sub"] == claims_clave["sub"]
    assert abs(claims_google["exp"] - claims_clave["exp"]) < 5


@pytest.mark.parametrize(
    "falla, codigo",
    [
        (ValueError("token inválido"), 401),
        (google_exceptions.GoogleAuthError("emisor incorrecto"), 401),
        (google_exceptions.TransportError("sin conexión"), 503),
    ],
)
def test_errores_al_verificar_el_token(cliente, usuarios, monkeypatch, falla, codigo):
    def verificar(token):
        raise falla

    monkeypatch.setattr(main, "verificar_token_google", verificar)

    respuesta = cliente.post("/auth/google", json={"id_token": "x"})

    assert respuesta.status_code == codigo
    assert usuarios.docs == []


@pytest.mark.parametrize("datos", [{"email_verified": False}, {"email": None}])
def test_correo_no_verificado_se_rechaza(cliente, usuarios, monkeypatch, datos):
    token_de_google_simulado(monkeypatch, **datos)

    respuesta = cliente.post("/auth/google", json={"id_token": "x"})

    assert respuesta.status_code == 401
    assert usuarios.docs == []


def test_sin_cliente_configurado_no_verifica_nada(cliente, monkeypatch):
    monkeypatch.setattr(main, "GOOGLE_CLIENT_IDS", [])

    respuesta = cliente.post("/auth/google", json={"id_token": "x"})

    assert respuesta.status_code == 503


def test_cuenta_creada_con_google_no_entra_con_contrasena(
    cliente, usuarios, monkeypatch
):
    token_de_google_simulado(monkeypatch)
    cliente.post("/auth/google", json={"id_token": "x"})

    for clave in ("", "cualquiera", "None"):
        respuesta = cliente.post(
            "/auth/login",
            json={"email": "ana@correo.com", "password": clave},
        )
        assert respuesta.status_code == 401


@pytest.fixture
def firmar(monkeypatch):
    def nueva_llave():
        llave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        privada = llave.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
        publica = llave.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return privada, publica

    privada, publica = nueva_llave()
    monkeypatch.setattr(
        google_id_token,
        "_fetch_certs",
        lambda request, url: {"kid-1": publica.decode()},
    )

    def firmar_token(
        aud=CLIENT_ID,
        iss=EMISOR_GOOGLE,
        vence_en=3600,
        privada_usada=None,
    ):
        ahora = int(time.time())
        payload = {
            "iss": iss,
            "aud": aud,
            "sub": "1234567890",
            "email": "ana@correo.com",
            "email_verified": True,
            "iat": ahora - 10,
            "exp": ahora + vence_en,
        }
        signer = crypt.RSASigner.from_string(privada_usada or privada, "kid-1")
        token = google_jwt.encode(signer, payload)
        return token.decode() if isinstance(token, bytes) else token

    firmar_token.otra_llave = lambda: nueva_llave()[0]
    return firmar_token


def test_token_firmado_correctamente_se_acepta(cliente, usuarios, firmar):
    respuesta = cliente.post("/auth/google", json={"id_token": firmar()})

    assert respuesta.status_code == 200
    assert usuarios.docs[0]["email"] == "ana@correo.com"


@pytest.mark.parametrize(
    "caso",
    ["otro_cliente", "vencido", "emisor_falso", "firma_ajena", "basura"],
)
def test_tokens_invalidos_responden_401_y_no_crean_usuario(
    cliente, usuarios, firmar, caso
):
    tokens = {
        "otro_cliente": lambda: firmar(aud="otra-app.apps.googleusercontent.com"),
        "vencido": lambda: firmar(vence_en=-3600),
        "emisor_falso": lambda: firmar(iss="https://evil.example.com"),
        "firma_ajena": lambda: firmar(privada_usada=firmar.otra_llave()),
        "basura": lambda: "esto.no.es-un-token",
    }

    respuesta = cliente.post("/auth/google", json={"id_token": tokens[caso]()})

    assert respuesta.status_code == 401
    assert usuarios.docs == []


def test_acepta_cualquiera_de_los_clientes_configurados(
    cliente, usuarios, firmar, monkeypatch
):
    monkeypatch.setattr(
        main,
        "GOOGLE_CLIENT_IDS",
        ["web.apps.googleusercontent.com", CLIENT_ID],
    )

    respuesta = cliente.post("/auth/google", json={"id_token": firmar()})

    assert respuesta.status_code == 200
