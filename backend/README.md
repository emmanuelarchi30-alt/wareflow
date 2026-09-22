# Wareflow Backend

API REST para análisis de layouts de almacenes con IA.

## Instalación

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| PORT | Puerto del servidor (default: 3001) |
| SUPABASE_URL | URL de tu proyecto Supabase |
| SUPABASE_ANON_KEY | Clave anónima de Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Clave de servicio (para backend) |
| ANTHROPIC_API_KEY | API Key de Anthropic (Claude) |
| COUNTRY_STATE_CITY_API_KEY | API Key de countrystatecity.in |
| FRONTEND_URL | URL del frontend para CORS |

## Base de Datos

Ejecuta el SQL en `src/db/setup.sql` en el SQL Editor de Supabase.

## Ejecución

```bash
npm run dev  # Desarrollo con hot reload
npm start    # Producción
```start

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/warehouses | Crear almacén |
| GET | /api/warehouses/:userId | Listar almacenes de usuario |
| POST | /api/analyses | Subir imagen y crear análisis |
| GET | /api/analyses/:id | Obtener análisis completo |
| GET | /api/location/countries | Lista de países |
| GET | /api/location/states/:countryCode | Regiones de un país |
| GET | /api/location/cities/:countryCode/:stateCode | Ciudades de una región |

## Flujo de Análisis

1. POST `/api/analyses` con `multipart/form-data` (image, warehouseId, userId)
2. Retorna `{ analysisId, imageUrl }` inmediatamente
3. Backend procesa en background con Claude Vision
4. GET `/api/analyses/:id` para obtener resultados cuando `status === 'completed'`