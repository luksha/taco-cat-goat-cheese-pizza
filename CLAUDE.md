# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Express + Vite HMR) on port 5000
npm run build     # Build for production (client → dist/public, server → dist/index.cjs)
npm run start     # Run production build
npm run check     # TypeScript type-check (tsc)
npm run db:push   # Push Drizzle schema to the database
```

No test suite is configured.

## Architecture

This is a full-stack single-page app where a single Express server (`server/index.ts`) handles both the REST API and serves the Vite-built React frontend.

**Stack:**
- Frontend: React 18 + TypeScript, Vite, Wouter (routing), TanStack Query, Framer Motion, Tailwind CSS + shadcn/ui
- Backend: Express, Drizzle ORM, PostgreSQL (via `pg`)
- Shared: `shared/` contains the DB schema (`schema.ts`) and typed API route definitions (`routes.ts`) consumed by both client and server

**Path aliases** (configured in `vite.config.ts`):
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

**API contract** lives in `shared/routes.ts` — it defines request/response Zod schemas and paths used by both `server/routes.ts` (handler registration) and client hooks (`client/src/hooks/use-scores.ts`). Always update both sides together.

**Game logic** is entirely client-side state in `client/src/pages/Game.tsx`. The server only persists high scores (`/api/scores` GET/POST).

**Language/i18n** is handled client-side via `client/src/lib/language.ts`. Card names (`Taco`, `Cat`, `Goat`, `Cheese`, `Pizza`) are the canonical keys; translations for English and Serbian are stored in `CARD_LABELS`. The selected language is persisted to `localStorage`.

**Card images** are served as static assets from `client/public/images/`. The mapping from card type to image/color is in `GameCard.tsx`'s `CardConfig`.

## Game mechanics

- Players see the current "chant word" and a face-down card. **FLIP** reveals the card; **CLAP** signals a match between the card and the chant word.
- Correct clap: +100 points + streak bonus (every 5-streak adds 50). Wrong clap: −100. Missed match (flipping without clapping when it was a match): −50.
- Each turn has a 10-second timer (`TURN_DURATION = 10000ms`). Timeout triggers an auto-flip with a −50 penalty.
- Confetti fires on every 5th consecutive correct match.
- Keyboard: `Space` = Flip, `Enter` = Clap.

## Database

Requires a `DATABASE_URL` environment variable (PostgreSQL). Schema is in `shared/schema.ts` — a single `high_scores` table. Run `npm run db:push` after schema changes.
