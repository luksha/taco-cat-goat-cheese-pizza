# Flip Chant Game

## Overview

A single-player arcade-style card matching game inspired by "Taco Cat Goat Cheese Pizza." Players must quickly identify when a spoken/displayed word matches a revealed card and react by pressing CLAP on correct matches. The game tracks scores, streaks, and maintains a persistent leaderboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React Query for server state, local React state for game logic
- **Styling**: Tailwind CSS with custom arcade-themed design system
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Animations**: Framer Motion for card flips, transitions, and feedback overlays
- **Effects**: canvas-confetti for celebration animations
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: Simple REST endpoints defined in shared/routes.ts with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Storage
- **Database**: PostgreSQL (required via DATABASE_URL environment variable)
- **Schema**: Single `high_scores` table storing username, score, max_streak, and timestamp
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components including game-specific ones
    pages/        # Route components (Home, Game, NotFound)
    hooks/        # Custom hooks for scores and utilities
    lib/          # Utilities and query client setup
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  db.ts           # Drizzle database connection
shared/           # Shared code between client and server
  schema.ts       # Drizzle schema definitions
  routes.ts       # API contract with Zod schemas
```

### Key Design Decisions
1. **Shared API Contract**: Routes and schemas defined in `shared/` directory enable type-safe API calls between client and server
2. **Client-Side Game Logic**: All game mechanics run in the browser for responsive gameplay; only high scores persist to server
3. **Monorepo Structure**: Single package.json manages both client and server dependencies with path aliases for clean imports

## External Dependencies

### Database
- **PostgreSQL**: Required for high score persistence. Connection via `DATABASE_URL` environment variable.

### Third-Party Services
- None required. The application is self-contained.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library for game interactions
- **canvas-confetti**: Visual celebration effects
- **zod**: Runtime schema validation for API contracts
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, tailwind-merge