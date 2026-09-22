Coloca aquí los videos de fondo:

- `login-bg.mp4`: fondo de Login y Registro.
- `app-bg.mp4`: fondo de las páginas después de iniciar sesión.

Opcionalmente agrega `login-poster.jpg` y `app-poster.jpg` como imágenes mientras
carga cada video.
# Video Assets

Coloca aquí tus archivos de video para el fondo de Login/Register:

- `login-bg.mp4` — Video principal (recomendado: 1920x1080, 10-30s, loop suave, <5MB)
- `login-bg.webm` — Fallback WebM (opcional)
- `login-poster.jpg` — Imagen poster (frame inicial, opcional)

El componente `VideoBackground` detecta automáticamente si el video carga correctamente y hace fallback al gradiente animado si hay error.