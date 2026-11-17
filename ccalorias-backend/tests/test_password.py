# test_password.py: contraseña de 8 a 72 bytes (HU1, RN-2). Se desarrolló con TDD (sección 5.8).
# La regla se prueba sobre el modelo UsuarioRegistro, sin servidor ni base de datos.
import pytest
from pydantic import ValidationError

from models import UsuarioRegistro


def _registrar(password):
    return UsuarioRegistro(email="luis@correo.com", password=password)


CONTRASENAS_VALIDAS = [
    ("CP-02 8 bytes", "Clave123"),
    ("CP-05 72 bytes", "a" * 72),
    ("CP-07 36 letras enie (72 bytes)", "ñ" * 36),
]


@pytest.mark.parametrize("caso, password", CONTRASENAS_VALIDAS, ids=[c[0] for c in CONTRASENAS_VALIDAS])
def test_contrasena_valida_se_acepta(caso, password):
    assert _registrar(password).password == password


CONTRASENAS_INVALIDAS = [
    ("CP-04 vacia", ""),
    ("CP-03 7 bytes", "Clave12"),
    ("CP-06 73 bytes", "a" * 73),
    ("CP-07 37 letras enie (74 bytes)", "ñ" * 37),
]


@pytest.mark.parametrize("caso, password", CONTRASENAS_INVALIDAS, ids=[c[0] for c in CONTRASENAS_INVALIDAS])
def test_contrasena_invalida_se_rechaza(caso, password):
    # En la API esto es un 422
    with pytest.raises(ValidationError):
        _registrar(password)
