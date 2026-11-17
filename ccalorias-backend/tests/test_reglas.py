# test_reglas.py: pruebas unitarias de las reglas de negocio de Ccalorias (capítulo 5).
# Cada prueba lleva el ID del caso del capítulo 4 (CP-xx) que automatiza.
# Los valores esperados están escritos a mano desde la regla, no calculados con el código.
from datetime import UTC, date, datetime, timedelta

import pytest
from jose import JWTError, jwt

import main  # main.py: detectar_tipo_imagen, crear_token, rango_del_dia, TAMANO_MAXIMO_BYTES

MB = 1024 * 1024


# ---------- datos de prueba: archivos falsos que solo tienen la cabecera de cada formato ----------
def _jpg(tamano):
    return (b"\xff\xd8\xff\xe0" + b"\x00" * tamano)[:tamano]


def _png(tamano):
    return (b"\x89PNG\r\n\x1a\n" + b"\x00" * tamano)[:tamano]


def _webp(tamano):
    return (b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * tamano)[:tamano]


def _gif(tamano):
    return (b"GIF89a" + b"\x00" * tamano)[:tamano]


def _pdf_renombrado_jpg(tamano):
    # un PDF que se llama foto.jpg: la función solo ve los bytes, no el nombre
    return (b"%PDF-1.7" + b"\x00" * tamano)[:tamano]


# =====================================================================================
# RN-4 · tipo y tamaño de la foto (HU3a) · detectar_tipo_imagen
# =====================================================================================
TIPOS_DE_ARCHIVO = [
    ("CP-14 JPG de 5 MB exactos", _jpg(5 * MB), "image/jpeg"),
    # El tipo no depende del tamaño: el 413 lo decide el endpoint (se prueba en el capítulo 6)
    ("CP-15 JPG de 5 MB + 1 byte", _jpg(5 * MB + 1), "image/jpeg"),
    ("CP-16 PNG de 1 MB", _png(1 * MB), "image/png"),
    ("CP-17 WebP de 1 MB", _webp(1 * MB), "image/webp"),
    ("CP-18 GIF de 1 MB", _gif(1 * MB), None),
    ("CP-19 PDF renombrado como .jpg", _pdf_renombrado_jpg(1 * MB), None),
    ("CP-20 Archivo vacio", b"", None),
]


@pytest.mark.parametrize("caso, archivo, esperado", TIPOS_DE_ARCHIVO, ids=[c[0] for c in TIPOS_DE_ARCHIVO])
def test_detectar_tipo_imagen(caso, archivo, esperado):
    # Arrange: el archivo de la tabla. Act:
    tipo = main.detectar_tipo_imagen(archivo)
    # Assert
    assert tipo == esperado


def test_limite_de_5_mb_son_5242880_bytes():
    # CP-14 y CP-15 · VL: 5 MB = 5 × 1024 × 1024, no 5.000.000
    assert main.TAMANO_MAXIMO_BYTES == 5_242_880
    # 5.242.880 bytes se aceptan; 5.242.881 pasan el límite
    assert not len(_jpg(5_242_880)) > main.TAMANO_MAXIMO_BYTES
    assert len(_jpg(5_242_881)) > main.TAMANO_MAXIMO_BYTES


# =====================================================================================
# RN-3 · token de sesión (HU2 y HU6) · crear_token y la decodificación con el JWT_SECRET
# =====================================================================================
def _decodificar(token):
    return jwt.decode(token, main.JWT_SECRET, algorithms=[main.JWT_ALGORITHM])


def test_cp13_el_token_del_login_dura_7_dias():
    antes = datetime.now(UTC)
    token = main.crear_token("64f1c0aa0000000000000001")
    expira = datetime.fromtimestamp(_decodificar(token)["exp"], UTC)
    # 7 días = 10.080 minutos; se deja 5 s de margen por el tiempo que tarda la prueba
    assert timedelta(days=7) - timedelta(seconds=5) <= expira - antes <= timedelta(days=7) + timedelta(seconds=5)


def test_cp13_el_token_lleva_el_id_del_usuario():
    token = main.crear_token("64f1c0aa0000000000000001")
    assert _decodificar(token)["sub"] == "64f1c0aa0000000000000001"


def test_cp38_token_alterado_no_se_acepta():
    # CP-38 a nivel unitario: la respuesta 401 del endpoint se prueba en el capítulo 6
    token = main.crear_token("64f1c0aa0000000000000001")
    cabecera, cuerpo, firma = token.split(".")
    firma_alterada = firma[:5] + ("A" if firma[5] != "A" else "B") + firma[6:]
    with pytest.raises(JWTError):
        _decodificar(f"{cabecera}.{cuerpo}.{firma_alterada}")


VENCIMIENTO_DEL_TOKEN = [
    # token creado hace 6 d 23 h 59 min → le queda 1 minuto
    ("CP-40 token de 6 d 23 h 59 min", timedelta(minutes=1), True),
    # token creado hace 7 d 1 min → venció hace 1 minuto
    ("CP-39 token de 7 d 1 min", timedelta(minutes=-1), False),
]


@pytest.mark.parametrize("caso, expira_en, se_acepta", VENCIMIENTO_DEL_TOKEN, ids=[c[0] for c in VENCIMIENTO_DEL_TOKEN])
def test_vencimiento_del_token(caso, expira_en, se_acepta):
    token = jwt.encode(
        {"sub": "64f1c0aa0000000000000001", "exp": datetime.now(UTC) + expira_en},
        main.JWT_SECRET,
        algorithm=main.JWT_ALGORITHM,
    )
    if se_acepta:
        assert _decodificar(token)["sub"] == "64f1c0aa0000000000000001"
    else:
        with pytest.raises(JWTError):
            _decodificar(token)


# =====================================================================================
# RN-7 · el día de un registro es el día de Bogotá (HU4 y HU5) · rango_del_dia
# =====================================================================================
def test_rango_del_dia_empieza_a_las_00_de_bogota():
    inicio, fin = main.rango_del_dia(date(2026, 11, 17))
    # 00:00 de Bogotá (UTC−5) = 05:00 UTC
    assert inicio == datetime(2026, 11, 17, 5, 0, 0, tzinfo=UTC)
    assert fin == datetime(2026, 11, 18, 5, 0, 0, tzinfo=UTC)


REGISTROS_POR_DIA = [
    # 11:30 p. m. del 17 en Bogotá = 04:30 UTC del 18
    ("CP-28 11:30 pm cuenta en el 17", datetime(2026, 11, 18, 4, 30, tzinfo=UTC), date(2026, 11, 17), True),
    ("CP-28 11:30 pm no cuenta en el 18", datetime(2026, 11, 18, 4, 30, tzinfo=UTC), date(2026, 11, 18), False),
    ("CP-29 23:59:59 de Bogota cuenta en el 17", datetime(2026, 11, 18, 4, 59, 59, tzinfo=UTC), date(2026, 11, 17), True),
    ("CP-29 00:00:00 de Bogota no cuenta en el 17", datetime(2026, 11, 18, 5, 0, 0, tzinfo=UTC), date(2026, 11, 17), False),
    ("CP-29 00:00:00 de Bogota cuenta en el 18", datetime(2026, 11, 18, 5, 0, 0, tzinfo=UTC), date(2026, 11, 18), True),
    # 6:59:59 p. m. de Bogotá = 23:59:59 UTC del 17; 7:00:00 p. m. = 00:00:00 UTC del 18
    ("CP-30 18:59:59 de Bogota cuenta en el 17", datetime(2026, 11, 17, 23, 59, 59, tzinfo=UTC), date(2026, 11, 17), True),
    ("CP-30 19:00:00 de Bogota cuenta en el 17", datetime(2026, 11, 18, 0, 0, 0, tzinfo=UTC), date(2026, 11, 17), True),
    # CP-35: el resumen de hoy usa el mismo rango; a las 11:00 p. m. el registro sigue siendo del 17
    ("CP-35 11:00 pm en el resumen del 17", datetime(2026, 11, 18, 4, 0, tzinfo=UTC), date(2026, 11, 17), True),
]


@pytest.mark.parametrize("caso, registro_utc, dia, esperado", REGISTROS_POR_DIA, ids=[c[0] for c in REGISTROS_POR_DIA])
def test_registro_en_dia_de_bogota(caso, registro_utc, dia, esperado):
    inicio, fin = main.rango_del_dia(dia)
    # mismo filtro que usa /registros: fecha_hora >= inicio y fecha_hora < fin
    assert (inicio <= registro_utc < fin) is esperado
