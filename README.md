# Ccalorias

App móvil que estima las calorías de un plato a partir de una foto. La app (React Native + Expo) envía la imagen a un backend (FastAPI), que la analiza con Gemini y guarda el resultado en MongoDB Atlas.

## Estructura del repositorio

```
ccalorias/                  raíz del repo y app móvil (Expo)
  src/                      código de la app (pantallas y componentes)
  .env.example              plantilla de la URL del backend
  .env.local                tu URL del backend (no se sube a Git)
  ccalorias-backend/        API (FastAPI)
    main.py
    models.py
    requirements.txt
    .env.example            plantilla de credenciales
    .env                    tus credenciales reales (no se sube a Git)
```

Los archivos `.env.example` sí están en Git y no tienen valores reales. Cada persona crea su propia copia (`.env` en el backend y `.env.local` en la app) y la rellena con sus datos. Esas copias nunca se suben.

## Requisitos

- Git
- Node.js 18 o superior (versión LTS)
- Python 3.12
- Expo Go instalado en el celular
- Un cluster de MongoDB Atlas (el gratuito M0 sirve)
- Una API key de Gemini, que se crea en aistudio.google.com

Para probar en el celular, el PC y el celular deben estar en la misma red Wi-Fi.

## 1. Clonar el repositorio

Clónalo fuera de OneDrive (por ejemplo en `C:\proyectos`), porque OneDrive sincroniza `node_modules` y puede dejar archivos incompletos.

```
git clone https://github.com/jesuscorreaga/ccalorias.git
cd ccalorias
```

## 2. Backend

Desde la raíz del repo:

```
cd ccalorias-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

En Mac o Linux: `source venv/bin/activate` y `cp .env.example .env`.

Abre `.env` y reemplaza los valores de ejemplo:

- `MONGO_URI`: el connection string de Atlas (Connect, Drivers).
- `JWT_SECRET`: una clave aleatoria. Puedes generarla con `python -c "import secrets; print(secrets.token_hex(32))"`.
- `GEMINI_API_KEY`: tu key de AI Studio.

En MongoDB Atlas, entra a Network Access y agrega la IP de tu PC (o `0.0.0.0/0` solo mientras desarrollas). Sin esto, la conexión a Mongo falla desde un PC nuevo.

Arranca el servidor:

```
python -m uvicorn main:app --reload --host 0.0.0.0
```

Comprueba que conecta abriendo `http://localhost:8000/health/db`. Debe responder `{"mongo": "conectado"}`. La documentación de la API está en `http://localhost:8000/docs`.

## 3. App móvil

Abre una segunda terminal en la raíz del repo (`ccalorias`):

```
npm install
copy .env.example .env.local
```

En Mac o Linux: `cp .env.example .env.local`.

Abre `.env.local` y deja en `EXPO_PUBLIC_API_URL` la dirección del backend según dónde pruebes:

| Dónde pruebas                  | Valor                     |
| ------------------------------ | ------------------------- |
| Navegador del PC (`w` en Expo) | `http://localhost:8000`   |
| Celular con Expo Go            | `http://IP_DE_TU_PC:8000` |

La IP de tu PC se obtiene con `ipconfig` (campo "Dirección IPv4" del adaptador Wi-Fi; en Mac o Linux, `ifconfig`). Para el celular, el backend debe estar arrancado con `--host 0.0.0.0`.

Arranca Expo:

```
npx expo start -c
```

Escanea el código QR con Expo Go, o pulsa `w` para abrirla en el navegador.

## 4. Primer uso

1. La app abre la pantalla de login.
2. Toca "Regístrate" y crea una cuenta.
3. Entra a la cámara, toma una foto de un plato y revisa la estimación.

Para probar solo el backend, sin la app, abre `http://localhost:8000/docs`, haz login en `/auth/login`, pega el token (sin comillas) en el botón Authorize y prueba los endpoints.

## Antes de hacer push

Verifica que no se suba ningún archivo con credenciales:

```
git ls-files | findstr /l /c:".env"
```

Solo deben aparecer `.env.example` y `ccalorias-backend/.env.example`. Si aparece `.env` o `.env.local`, no hagas push.

## Problemas comunes

| Síntoma                                                | Causa probable                                                       | Solución                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Network request failed` o `Failed to fetch` en la app | El backend no está encendido, o la URL de `.env.local` es incorrecta | Arranca el backend, revisa `.env.local` y reinicia con `npx expo start -c`                           |
| Funciona en el navegador pero no en el celular         | `localhost` no es tu PC desde el celular                             | Usa la IP del PC en `.env.local` y arranca el backend con `--host 0.0.0.0`                           |
| Sigue fallando aunque la IP esté bien                  | Firewall de Windows o una red con aislamiento de clientes            | Permite el puerto 8000 en redes privadas, o conecta el PC al punto de acceso del celular             |
| `/health/db` falla                                     | La IP del PC no está en Atlas, o el cluster está pausado             | Agrega la IP en Network Access y reanuda el cluster                                                  |
| `ModuleNotFoundError` al arrancar el backend           | Entorno virtual sin activar o dependencias sin instalar              | Activa el venv y corre `pip install -r requirements.txt`                                             |
| `Project is incompatible with this version of Expo Go` | La versión de Expo Go no coincide con el SDK del proyecto            | Actualiza el proyecto al SDK que soporte tu Expo Go, o instala la versión de Expo Go que corresponda |
| `Unable to resolve module` al abrir la app             | `node_modules` incompleto o desactualizado                           | Borra `node_modules`, corre `npm install` y arranca con `npx expo start -c`                          |
| 401 en Swagger                                         | Token pegado con comillas o vencido                                  | Copia solo el texto que empieza en `eyJ`, sin comillas                                               |
| 503 al analizar una foto                               | Gemini con mucha demanda                                             | Reintenta en un minuto                                                                               |
| Cambié `.env.local` y no se nota                       | Expo guarda la configuración en caché                                | Reinicia con `npx expo start -c`                                                                     |
