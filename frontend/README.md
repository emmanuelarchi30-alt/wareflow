# Wareflow Frontend

Interfaz de usuario para optimización de almacenes con visualización 3D.

## Stack

- React 18 + Vite
- TailwindCSS (configuración custom liquid glass)
- Three.js + @react-three/fiber + @react-three/drei (3D)
- Framer Motion (animaciones)
- Supabase JS (auth + database)
- React Hook Form + Zod (formularios)
- React Router v6

## Instalación

```bash
cd frontend
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| VITE_API_URL | URL del backend (ej: http://localhost:3001) |
| VITE_SUPABASE_URL | URL de Supabase |
| VITE_SUPABASE_ANON_KEY | Clave anónima de Supabase |

## Estructura de Carpetas

```
src/
├── components/
│   ├── ui/           # Componentes base (GlassPanel, GlassButton, etc.)
│   └── 3d/           # Componentes Three.js
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── AuthPage.jsx
│   ├── Dashboard.jsx
│   ├── NewAnalysis.jsx
│   └── AnalysisResult.jsx
├── services/
│   └── api.js
├── data/
│   └── mockAnalysis.js
├── App.jsx
├── main.jsx
└── index.css
```

## Scripts

```bash
npm run dev     # Desarrollo (puerto 5173)
npm run build   # Build producción
npm run preview # Preview build
```

## Video de Fondo (Login/Register)

Coloca tu video en:
```
public/videos/login-bg.mp4
public/videos/login-poster.jpg  # opcional, poster frame
```

El componente `VideoBackground` usa fallback automático al gradiente animado si no hay video.

## Paleta de Colores (tokens CSS)

Definidos en `tailwind.config.js` y `index.css`:

- `--bg-gradient-start`: #0B1220
- `--bg-gradient-mid`: #16324F
- `--bg-gradient-end`: #0B1220
- `--accent-orange`: #FF6B1A
- `--accent-yellow`: #FFC81A
- `--accent-blue`: #2E9CFF
- `--accent-steel`: #7C8DA6
- `--glass-bg`: rgba(255,255,255,0.08)
- `--glass-border`: rgba(255,255,255,0.18)
- `--glass-highlight`: rgba(255,255,255,0.35)
- `--status-critical`: #FF3B3B
- `--status-warning`: #FFC81A
- `--status-good`: #2ED47A
- `--text-primary`: #F5F7FA
- `--text-secondary`: #A9B4C4

## Niveles de Efecto Vidrio

1. **Nivel 1 (CSS puro)**: 90% componentes - `glass`, `glass-hover`, `glass-hero`
2. **Nivel 2 (SVG displacement)**: Solo Login/Register panel y modal resultados - `glass-hero` con filtro SVG
3. **Nivel 3 (WebGL)**: No usado en v1

## Despliegue

```bash
npm run build
# Sube carpeta dist/ a Vercel, Netlify, etc.
```