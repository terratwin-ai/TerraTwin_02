# TerraTwin - Digital Infrastructure for Bamboo Stewardship

## Overview

TerraTwin is a digital twin verification and coordination platform for bamboo landscapes in the Philippines. The platform connects bamboo stewardship activities to measurable proof, incentives, and market access for smallholder stewards and cooperatives.

Key features include:
- 3D landscape visualization with interactive bamboo plot markers (WebGL with 2D fallback)
- Steward management and tracking with earnings dashboard
- Plot verification workflows with milestone-based payments
- Real-time dashboard with carbon sequestration and earnings metrics
- Dark/light theme support

## Recent Changes
- Added Cesium 3D globe integration for real Philippine terrain visualization with satellite imagery
- CesiumLandscape component dynamically loads Cesium via CDN, displays plot markers at GPS coordinates
- Fallback to Three.js visualization if VITE_CESIUM_ION_TOKEN is not set
- Fixed React import order issue in LandscapeScene.tsx
- All tests passing for navigation, plots, stewards, and verification views

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

### Development Tools
- **Replit plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **esbuild**: Server bundling for production
- **TypeScript**: Full type checking across client and server