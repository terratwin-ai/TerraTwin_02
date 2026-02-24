# TerraTwin

**An agentic digital twin for coordination and enabling watershed-level regeneration.**

TerraTwin is a browser-based platform that connects bamboo stewardship activities in the Philippines to measurable proof, incentives, and market access. It creates a living digital twin of bamboo landscapes — coordinating smallholder stewards, cooperatives, and verification workflows across entire watersheds to drive large-scale ecological restoration.

---

## What It Does

- **3D Landscape Visualization** — Full-screen Cesium globe with real terrain, interactive plot markers, and simulated bamboo growth over time (2026–2040)
- **Steward Coordination** — Track farmers, cooperatives, plot assignments, and verification milestones across a watershed
- **Carbon & Harvest Economics** — Dual income modeling: carbon credits ($30/ton CO₂e) and pole harvest (150 clumps/ha, 20 poles/clump/year from year 5)
- **AI Agent** — Conversational assistant (Claude) embedded in plot views for verification guidance, carbon estimates, and earnings queries
- **Satellite Analysis** — Simulated Earth observation panels with NDVI heatmaps, biomass estimates, and multi-model support (Clay Foundation, AlphaEarth)
- **Mobile Steward Flow** — Phone-friendly interface for field stewards to view plots, submit verification evidence, and track earnings
- **Project Aggregation** — Group smallholder plots into registry-ready carbon credit projects with milestone tracking and document management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| 3D | CesiumJS (globe + terrain), React Three Fiber (landscape scene) |
| UI | shadcn/ui, Tailwind CSS, Radix UI |
| Routing | Wouter |
| State | TanStack Query v5 |
| Backend | Node.js, Express, TypeScript (ESM) |
| Database | PostgreSQL (Drizzle ORM) |
| AI | Anthropic Claude via Replit AI Integrations |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- A Cesium Ion access token (for 3D terrain)

### 1. Clone the repository

```bash
git clone https://github.com/terratwin-ai/TerraTwin_02.git
cd TerraTwin_02
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file or set these in your environment:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for Express sessions |
| `VITE_CESIUM_TOKEN` | Cesium Ion access token for 3D terrain rendering |

### 4. Initialize the database

```bash
npm run db:push
```

This creates all tables and seeds sample data (stewards, plots, projects, cooperatives, verification events).

### 5. Run the app

```bash
npm run dev
```

The app starts on **http://localhost:5000**.

---

## Project Structure

```
client/                 # React frontend
  src/
    components/         # UI components (Cesium map, floating panels, chat, etc.)
    pages/              # Route pages (Dashboard, FarmerPlotView, ProjectDetail, Steward*)
    hooks/              # Custom React hooks
    lib/                # Utilities, query client
server/                 # Express backend
  routes.ts             # API endpoints
  storage.ts            # Database access layer (Drizzle)
  db.ts                 # Database connection
  seed.ts               # Sample data seeding
shared/                 # Shared between client and server
  schema.ts             # Drizzle schema + Zod validators
```

---

## Key Routes

| Path | Description |
|------|-------------|
| `/` | Admin dashboard with 3D Cesium globe |
| `/plot/:id` | Immersive plot detail with terrain, bamboo simulation, and AI chat |
| `/projects/:id` | Project detail with timeline, documents, and steward listing |
| `/steward` | Steward login |
| `/steward/home` | Steward plot list |
| `/steward/earnings` | Earnings dashboard with payment history |

---

## Data Model

- **Stewards** — Smallholder bamboo farmers with plot assignments and earnings
- **Plots** — Geolocated bamboo parcels with health scores, carbon data, and verification status
- **Projects** — Aggregation vehicles that group plots for carbon credit issuance (Verra, Gold Standard)
- **Cooperatives** — Farmer groups within projects (leaders, members, treasurers)
- **Verification Events** — Milestone-based checks (planting, maintenance, survival) with payment triggers
- **Conversations & Messages** — AI chat history linked to specific plots

---

## Harvest & Carbon Model

- **Region**: Mt. Anggas, Gitagum, Misamis Oriental, Philippines
- **Species**: Giant Bamboo (*Dendrocalamus asper*)
- **Planting Year**: 2026
- **Clump Density**: 150 clumps/ha (8m × 8m grid)
- **Pole Harvest**: 20 poles/clump/year starting year 5 (2031) at $10/pole
- **Carbon Sequestration**: 8.75 t CO₂e/ha/year at $30/ton
- **Timeline**: 2026–2040

---

## License

This project is proprietary to TerraTwin AI.
