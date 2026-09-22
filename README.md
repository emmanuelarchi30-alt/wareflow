# Wareflow

**AI-powered warehouse layout analysis with interactive 3D visualization.**

Wareflow is a full-stack application that lets logistics teams upload floor-plan images of a warehouse and receive AI-generated recommendations to optimize storage and dispatch operations. Every analysis is rendered as an interactive 3D scene that simulates forklifts, workers, conveyors and more, so you can visualize problems and their solutions in real time.

![Stack](https://img.shields.io/badge/Stack-React·Vite·Tailwind·Three.js·Express·Supabase·Anthropic-blueviolet)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Automatic setup (Linux/macOS)](#automatic-setup-linuxmacos)
  - [Manual setup](#manual-setup)
- [API Reference](#api-reference)
- [How an Analysis Works](#how-an-analysis-works)
- [3D Warehouse Scene](#3d-warehouse-scene)
- [Video Backgrounds](#video-backgrounds)
- [Design Tokens (Colors)](#design-tokens-colors)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Changelog](#changelog)
- [License](#license)

---

## Features

- **AI layout analysis** — Upload a warehouse floor-plan image; Claude Vision detects your warehouse type, assigns a performance score and identifies optimization opportunities across `dispatch`, `storage`, and `obstruction` issues.
- **Interactive 3D warehouse** — A Three.js (react-three-fiber) scene renders racks, forklifts, AGV robots, workers, conveyors, trucks and dozens of environment details. Problem zones are highlighted and clickable.
- **Smart recommendations** — Each detected issue comes with a severity level and an actionable suggestion for real warehouse improvements.
- **Update simulations** — Apply fix suggestions and watch the mock KPIs (average travel time, picking efficiency) improve.
- **Accurate location forms** — Country / state / city selection driven by the countrystatecity.in API.
- **Auth & persistence** — Supabase Auth + Postgres: users, warehouses and analyses stored per user.
- **PDF report export** — Generate a .pdf report of an analysis result directly in the browser.
- **Support contact form** — Email support endpoint using Nodemailer (SMTP).

---

## Tech Stack

**Frontend** (`frontend/`)
- React 18 + Vite 5
- TailwindCSS 3 (custom "liquid glass" design system)
- Three.js + @react-three/fiber + @react-three/drei (3D)
- Framer Motion (animations)
- React Router v6, React Hook Form + Zod
- Supabase JS (auth + database)
- jsPDF + html2canvas (report export)

**Backend** (`backend/`)
- Node.js + Express
- Anthropic Claude Vision SDK (AI analysis)
- Supabase (Postgres + auth verification)
- Multer (file upload) + Sharp (image preprocessing)
- Nodemailer (SMTP support emails)
- WebSocket (`ws`) + Server-Sent progress updates
- express-rate-limit, Zod (validation)

**Database** — Supabase Postgres (schema in `backend/src/db/setup.sql`).

---

## Project Structure

```
wareflow/
├── backend/
│   ├── src/
│   │   ├── index.js            # Express app + API routes
│   │   └── db/
│   │       └── setup.sql        # Supabase schema (run in SQL Editor)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── videos/
│   │       ├── fondo.mp4        # Background for logged-in screens
│   │       └── login-bg.mp4     # Background for Login/Register screens
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # GlassPanel, GlassButton, VideoBackground, ...
│   │   │   └── 3d/              # Warehouse3D.jsx (full Three.js scene)
│   │   ├── pages/               # AuthPage, Dashboard, NewAnalysis,
│   │   │                        # AnalysisResult, LogisticsProblems, ...
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js
│   │   ├── data/mockAnalysis.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── setup.sh                     # One-command initial setup
├── .env.example                 # Reference for all variables
└── README.md
```

---

## Prerequisites

- **Node.js 18+** (tested with 18/20)
- A **Supabase** project (auth + database enabled)
- An **Anthropic** API key (Claude Vision) — https://console.anthropic.com
- A free **countrystatecity.in** API key — https://countrystatecity.in
- (Optional) SMTP credentials for the support form

---

## Environment Variables

Reference file: [`.env.example`](./.env.example). Copy the relevant slice into both `frontend/.env` and `backend/.env`.

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3001`) |
| `NODE_ENV` | `development` / `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-side only) |
| `ANTHROPIC_API_KEY` | Claude Vision API key |
| `COUNTRY_STATE_CITY_API_KEY` | countrystatecity.in API key |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP server config (support email) |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP credentials + sender address |

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` has full database access. Never expose it to the frontend.

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:3001`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

---

## Getting Started

### Automatic setup (Linux/macOS)

```bash
./setup.sh
```

The script checks your Node version, installs dependencies for both apps and copies the `.env.example` files into `.env`. Then edit the `.env` files with your real credentials.

### Manual setup

**1. Database — Supabase**

Open the SQL Editor of your Supabase project and run the schema in `backend/src/db/setup.sql` (tables for users, warehouses, analyses and analysis result details).

**2. Backend**

```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your credentials
npm run dev                 # http://localhost:3001
```

**3. Frontend**

```bash
cd frontend
npm install
cp .env.example .env        # then edit .env with your credentials
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**, register an account, create a warehouse, upload a floor-plan image and run an analysis.

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/warehouses` | Create a warehouse |
| `GET` | `/api/warehouses/:userId` | List a user's warehouses |
| `POST` | `/api/analyses` | Upload image + run AI analysis |
| `GET` | `/api/analyses/:id` | Fetch full analysis result |
| `POST` | `/api/support` | Send a support email (SMTP) |
| `GET` | `/api/location/countries` | List of countries |
| `GET` | `/api/location/states/:countryCode` | States/regions of a country |
| `GET` | `/api/location/cities/:countryCode/:stateCode` | Cities of a state/region |

---

## How an Analysis Works

1. `POST /api/analyses` sends the image as `multipart/form-data` (`{ image, warehouseId, userId }`).
2. The API responds immediately with `{ analysisId, imageUrl }`.
3. In the background the backend pre-processes the image with **Sharp** and sends it to **Claude Vision**, which:
   - detects the warehouse type (`general`, `ecommerce`, `food`, `manufacturing`, ...);
   - assigns a performance score and completion percentage;
   - generates issues categorized as `dispatch`, `storage` or `obstruction`, each with severity and a recommendation.
4. The frontend polls `GET /api/analyses/:id` until `status === 'completed'`, then renders the results and the 3D scene.

---

## 3D Warehouse Scene

`frontend/src/components/3d/Warehouse3D.jsx` builds the full scene. In addition to the core layout (floor, zone tiles, racks, trucks, office annex, security booth, AGV charge station, terminals, ceiling lights, actors), the scene has been enriched with:

- **Packaging stations & loading docks** (`PackagingStation`, `LoadingDock`, `MorePackagingAreas`, `MoreLoadingDocks`)
- **Heavy equipment** — 6 forklifts, jib cranes, oil drums, utility carts
- **Personnel** — 7 workers walking along animated paths
- **Conveyors & transport** — 5 conveyor belts, 3 trucks, parking lines, extra containers
- **Logistics props** — 20 scattered pallets, stacked crates, reflective floor markers
- **Safety & environment** — 6 fire extinguishers, 12 safety cones + barriers, extra signage, canopy structure, 8 extra ceiling lights, dust particles
- **Interactive issue markers** — detected issues are placed in the world; clicking them selects and highlights the affected zone

All actors animate in a `requestAnimationFrame` loop driven by a shared `simRef`, so forklift paths, conveyor motion and worker routes stay synchronized.

---

## Video Backgrounds

The `VideoBackground` component (`frontend/src/components/ui/VideoBackground.jsx`) plays a looping video behind screens with a color overlay + gradient. If the video is missing it falls back to the animated CSS gradient.

| Where | Video | Overlay |
|-------|-------|---------|
| **Login / Register / Forgot password** | `/videos/login-bg.mp4` | default `bg-black/30` + original gradient |
| **Authenticated screens** | `/videos/fondo.mp4` | light overlay `bg-black/15` so the scene stays vivid |

> The login page background is intentionally kept untouched.

To change a background, drop a new file in `frontend/public/videos/` and adjust the `src` (and optional `gradientClassName` / `overlayClassName`) passed to `VideoBackground` in `frontend/src/App.jsx`.

---

## Design Tokens (Colors)

Defined in `tailwind.config.js` and `src/index.css`:

| Token | Value |
|-------|-------|
| `--bg-gradient-start` | `#0B1220` |
| `--bg-gradient-mid` | `#16324F` |
| `--bg-gradient-end` | `#0B1220` |
| `--accent-orange` | `#FF6B1A` |
| `--accent-yellow` | `#FFC81A` |
| `--accent-blue` | `#2E9CFF` |
| `--accent-steel` | `#7C8DA6` |
| `--glass-bg` | `rgba(255,255,255,0.08)` |
| `--glass-border` | `rgba(255,255,255,0.18)` |
| `--glass-highlight` | `rgba(255,255,255,0.35)` |
| `--status-critical` | `#FF3B3B` |
| `--status-warning` | `#FFC81A` |
| `--status-good` | `#2ED47A` |
| `--text-primary` | `#F5F7FA` |
| `--text-secondary` | `#A9B4C4` |

---

## Scripts

**Frontend**

```bash
npm run dev      # Dev server (port 5173)
npm run build    # Production build in dist/
npm run preview  # Preview the production build
```

**Backend**

```bash
npm run dev        # Dev with hot reload (port 3001)
npm start          # Production start
npm run db:setup   # Run DB setup helper
```

---

## Deployment

- **Frontend** — Vercel / Netlify: build with `npm run build` and upload the `dist/` folder.
- **Backend** — Railway / Render / Fly.io: set the backend env vars, then `npm start`.
- **Database** — Supabase (managed). Make sure the schema in `backend/src/db/setup.sql` is applied to the production project.
- Update `VITE_API_URL` and `FRONTEND_URL` to the production URLs.

---

## Changelog

### v1.1.0
- **Design refinement:** reduced background overlay on authenticated screens (`bg-black/15`) so the video stays vivid; login background left as-is.
- **3D scene enrichment:** added packaging stations, loading docks, more forklifts/workers/conveyors/pallets/containers, ceiling lights, signage, fire extinguishers, utility carts, oil drums, safety cones, jib cranes and interactive issue markers.
- **Documentation:** professional English README for the whole project.

### v1.0.0
- Initial release: AI analysis pipeline, 3D visualization, auth, location forms, PDF export and support email.

---

## License

Private/internal project.