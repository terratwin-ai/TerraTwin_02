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
- **Plot Auto-Zoom & Mobile Data Panel Optimization** - Improved /plot/:id experience
  - Cesium camera auto-flies to plot center at computed altitude based on plot area (1.5s animation)
  - FloatingDataCards redesigned: compact header always visible (plot name, year slider, total income)
  - Expandable "More details" section on mobile (collapsed by default), always expanded on desktop
  - Close button accessible on mobile to dismiss panel entirely
  - ProjectDetail responsive: smaller padding, text-xs tabs, credit issuance adapted for narrow screens
- **Mobile-Responsive Admin Dashboard** - All floating panels now adapt to mobile screens
  - FloatingNavMenu: Full-width top bar on mobile, 380px side panel on desktop
  - FloatingPlotDetail: Bottom sheet on mobile, right-side panel on desktop
  - FloatingLandscapeChat: Floating AI icon button on mobile (bottom-right), opens as bottom drawer; bottom-left 380px panel on desktop
  - FloatingLandscapeStats: Scrollable compact bar below nav on mobile, top-right on desktop
  - FloatingProjectsPanel & FloatingLandscapeSatellite: Bottom sheets on mobile
  - Mobile panel coordination: Only one bottom panel visible at a time on mobile
  - Non-landscape views: Top padding on mobile instead of left padding for content offset
  - Breakpoint: md (768px) separates mobile/desktop layouts
- **Multi-Model Satellite Analysis** - Support for multiple Earth observation AI models
  - Model selector dropdown in satellite analysis panels (plot-level and landscape-level)
  - Clay Foundation Model (Made With ML): Open-source, Sentinel-2 based, 768-dimension embeddings
  - AlphaEarth Foundations (Google DeepMind): Multi-modal (optical, radar, LiDAR), 64-dimension embeddings
  - Dynamic loading messages and footer attribution based on selected model
  - Model-specific differences: AlphaEarth shows better cloud penetration (98% vs 94% coverage)
  - "New" badge indicator for AlphaEarth model
- **AI Chat Switched to Claude** - Replaced OpenAI with Anthropic Claude (claude-sonnet-4-5)
  - Streaming responses via Replit AI Integrations
  - No API key required - billed to Replit credits
- **Landscape-Level Satellite Analysis** - Earth observation model visualization at the project level
  - FloatingLandscapeSatellite: Slide-in panel with landscape-wide satellite metrics
  - 3-tab interface: Overview, NDVI, Trends
  - Overview tab: Total hectares, plot count, carbon stock, biomass totals
  - Health distribution chart showing plots by vegetation density category
  - Change detection summary (growth/stable/decline counts)
  - NDVI tab: Landscape average NDVI gauge, 10x10 heatmap grid
  - Trends tab: 6-month NDVI time series, sensor/capture info
  - "Satellite Analysis" button in Dashboard header to open panel
  - Model selector to switch between Clay and AlphaEarth
- **LGND Discover-Style Immersive Plot View** - Full redesign of FarmerPlotView inspired by lgnd.ai/discover
  - Full-screen Cesium 3D terrain map as immersive background
  - FloatingChatPanel: Expandable AI chat with glass-morphism styling
    - Quick action badges (Carbon potential, Vegetation health, Earnings)
    - Embedded data visualizations in AI responses (stats cards with metrics)
    - Conversational search that parses natural language queries
  - FloatingDataCards: Overlay panels with plot info, year slider, carbon metrics
  - FloatingSatellitePanel: Slide-in/out panel for satellite analysis
  - Sensor cards (temperature, moisture, health) as floating overlays
  - Visual feedback for search queries (border highlight, query indicator badge)
- **Satellite Analysis Tab** - Clay Foundation Model prototype visualization in plot detail panel
  - 3-tab interface in plot detail panel: Details, Satellite, AI Agent
  - NDVI gauge with color-coded vegetation health (dense/moderate/sparse/low)
  - 8x8 NDVI heatmap grid with gradient visualization
  - Biomass estimates, carbon stock, and health score metrics
  - 6-month time series chart showing NDVI trends
  - Change detection summary (growth/stable/decline with percentage)
  - Simulated Sentinel-2 capture information (resolution, cloud cover)
  - Consistent numeric normalization and data-testid attributes for testing
- **Project Detail View** - Full detail page for individual projects at /projects/:id
  - 4 tabbed sections: Overview, Timeline, Documents, Stewards
  - Overview shows project plots, cooperatives, and credit issuance stats
  - Timeline displays milestone progression (documentation, public comment, audit, site visit, approval, credit issuance)
  - Documents table with submission dates and PDF download links
  - Stewards view showing all farmers contributing to the project with earnings
- **Cooperatives Model** - Groups of stewards within projects
  - cooperatives table (projectId, name, region, notes, memberCount)
  - cooperativeMembers join table (cooperativeId, stewardId, role)
  - Roles: leader, member, treasurer, secretary
  - Sample cooperatives: "San Isidro Bamboo Farmers Cooperative", "Tagoloan Valley Stewards Association"
- **Project Timeline & Documentation** - Carbon registry workflow tracking
  - projectMilestones table (title, description, milestoneType, status, dueDate, completedAt)
  - projectDocuments table (title, documentType, fileUrl, submittedAt)
  - Sample milestones for Mindanao Bamboo Collective (2 completed, 1 in progress, 3 pending)
- **Projects Aggregation Layer** - Added Projects entity to aggregate smallholder plots for carbon credit issuance
  - Projects table with aggregation fields (totalHectares, totalStewards, totalPlots, creditsIssued, creditsRetired, vintage)
  - Plots now link to projects via projectId foreign key
  - API endpoints: GET/POST /api/projects, GET/PATCH /api/projects/:id, GET /api/projects/:id/plots
  - Additional endpoints: GET /api/projects/:id/stewards, /milestones, /documents, /cooperatives
  - Sample projects: "Mindanao Bamboo Collective" (8 plots), "Cagayan de Oro Restoration Initiative" (2 plots)
  - Methodology tracking (verra-bamboo, gold-standard) for verification standards
- **LiDAR Analysis Visualization** - Added simulated LiDAR point cloud display in plot detail view
  - Toggle switch to enable/disable LiDAR visualization
  - "Capture LiDAR Scan" button with 3-second simulated drone scan
  - 625 height-colored points (green→lime→yellow→red gradient) on 4m grid
  - Points grow with bamboo based on year slider
- **Farmer Plot View with Cesium Terrain** - Dedicated plot detail page at /plot/:id route
  - Real satellite terrain from Cesium Ion with 1-hectare cropping via Globe.clippingPlanes
  - ClippingPlaneCollection with ENU transform creates 100m x 100m bounded area
  - Visual mask polygon fallback for browsers without clipping plane support
  - Camera constraints: no panning, locked lookAt on plot center, 80-200m zoom range
  - 3D bamboo entities (cylinders + leaves) that grow based on year slider (2024-2035)
  - Growth timeline slider showing bamboo maturation from 0.5m to 25m
  - Carbon sequestration calculations (Giant Bamboo - 8.75 t CO2e/ha/yr)
  - Projected income from carbon credits ($30/tonne) and harvest ($12/pole)
  - Double-click on Cesium plot markers navigates to this view
  - WebGL detection with graceful fallback UI
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
- **Projects**: Aggregation vehicle for smallholder plots (links to carbon registries, tracks credits issued/retired)
- **Stewards**: Community bamboo farmers with plot and earnings tracking
- **Plots**: Geolocated bamboo plots with health scores, carbon data, verification status, and project membership
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