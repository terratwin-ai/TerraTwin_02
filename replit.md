# TerraTwin - Digital Infrastructure for Bamboo Stewardship

## Overview

TerraTwin is a digital twin verification and coordination platform for bamboo landscapes in the Philippines. The platform connects bamboo stewardship activities to measurable proof, incentives, and market access for smallholder stewards and cooperatives.

Key features include:
- 3D landscape visualization with interactive bamboo plot markers (WebGL with 2D fallback)
- Steward management and tracking with earnings dashboard
- Plot verification workflows with milestone-based payments
- Real-time dashboard with carbon sequestration and earnings metrics
- AI agent chat interface for plot management and verification assistance
- Dark/light theme support

## Recent Changes
- **Farmer Plot View** - Dedicated plot detail page at /plot/:id route
  - 3D terrain visualization with Three.js (WebGL with graceful fallback)
  - Simulated sensor data display (temperature, soil moisture, humidity, light)
  - Growth timeline slider (2024-2035) showing bamboo maturation
  - Carbon sequestration calculations (Giant Bamboo - 8.75 t CO2e/ha/yr)
  - Projected income from carbon credits ($30/tonne) and harvest ($12/pole)
  - Double-click on Cesium plot markers navigates to this view
- **AI Agent in Steward App** - Stewards can now chat with the AI agent in plot detail pages
  - Tabbed UI: Details / AI Agent tabs
  - Context-aware chat about plot verification, carbon tracking, and earnings
- **Steward Mobile Flow** - Added mobile-first steward portal at /steward/* routes
  - StewardLogin: Simple steward selection (localStorage-based session)
  - StewardHome: View assigned plots with status badges
  - StewardCapture: Quick access to plots needing verification
  - StewardPlotDetail: Plot info with "Capture Verification" button + AI Agent tab
  - StewardSubmit: Evidence capture form (photo, GPS, notes)
  - StewardEarnings: Total earnings, carbon stats, payment history
  - Mobile bottom navigation (My Plots, Capture, Earnings tabs)
- Cesium map search bar for finding plots by name/status
- AI agent chat transitions within PlotDetailPanel (no modal)
- AgentChat component with streaming SSE responses using Replit AI Integrations
- Cesium 3D globe with ResizeObserver for responsive layout
- Dark/light theme support with heatmap gradient status indicators

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom build script
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **3D Rendering**: React Three Fiber with Drei helpers for landscape visualization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom earthy bamboo theme (light/dark modes)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON endpoints under `/api/*`
- **Development**: Vite middleware for HMR in development
- **Production**: Static file serving from built client assets

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for schema management (`db:push` command)
- **Schema Location**: `shared/schema.ts` (shared between client and server)

### Key Data Models
- **Users**: Basic authentication (username/password)
- **Stewards**: Community bamboo farmers with plot and earnings tracking
- **Plots**: Geolocated bamboo plots with health scores, carbon data, and verification status
- **Verification Events**: Milestone events (planting, maintenance, survival checks) with payment triggers
- **Conversations**: AI chat sessions linked to plots for contextual assistance
- **Messages**: Chat history for each conversation (user/assistant roles)

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components including 3D landscape scene
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API endpoint definitions
  storage.ts      # Database access layer
  db.ts           # Drizzle database connection
  seed.ts         # Sample data seeding
shared/           # Shared code between client/server
  schema.ts       # Drizzle schema and Zod validators
```

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Uses `connect-pg-simple` for session storage

### Third-Party Libraries
- **@react-three/fiber** and **@react-three/drei**: 3D scene rendering for landscape visualization
- **Radix UI**: Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- **TanStack Query**: Data fetching and caching
- **Zod**: Runtime schema validation with `drizzle-zod` integration
- **date-fns**: Date formatting utilities
- **OpenAI SDK**: AI chat via Replit AI Integrations (streaming SSE responses)

### Development Tools
- **Replit plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **esbuild**: Server bundling for production
- **TypeScript**: Full type checking across client and server