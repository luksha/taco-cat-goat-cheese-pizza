# Flip Chant Game

A digital adaptation of the **Taco Cat Goat Cheese Pizza** card game — playable solo or with friends in real-time multiplayer.

## How to Play

Players chant the card names in sequence (Taco → Cat → Goat → Cheese → Pizza → repeat). Each round, a card is revealed face-up:

- **CLAP** if the revealed card matches the current chant word → **+100 pts** (+ streak bonus every 5 in a row)
- **FLIP** to be first to advance the round → **+50 pts**
- Wrong clap → **−50 pts**
- Timeout (3s) → **−25 pts** for all players

A confetti burst fires every 5th consecutive correct clap.

## Modes

### Solo
Play against yourself. Score is submitted to the global leaderboard at the end.

### Multiplayer (up to 4 players)
- One player creates a room and shares the 4-character code
- Others join with the code and a username
- Host starts the game; all players see the same card simultaneously
- The server arbitrates who pressed first — no client-side cheating
- Winner's score is auto-submitted to the leaderboard

## Setup

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# Install dependencies
npm install

# Set environment variable
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/flipchant" > .env

# Push DB schema
npm run db:push

# Start dev server (http://localhost:5173)
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR on port 5173 |
| `npm run build` | Production build (client → `dist/public`, server → `dist/index.cjs`) |
| `npm run start` | Run production build |
| `npm run check` | TypeScript type-check |
| `npm run db:push` | Push Drizzle schema to the database |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Wouter, TanStack Query, Framer Motion, Tailwind CSS, shadcn/ui
- **Backend:** Express, WebSockets (`ws`), Drizzle ORM, PostgreSQL
- **Shared:** Typed API contracts and WebSocket message types in `shared/`

## Languages

Supports **English** and **Serbian**. The selected language is persisted in `localStorage`. Card names in Serbian: Tako / Cica / Koza / Sir / Pica.
