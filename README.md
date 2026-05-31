# 🔥 Hearth

**An AI matchmaker that gets you off the app and into real life.**

Hearth is a dating app built around a different idea than Bumble/Hinge: instead of an
infinite swipe feed, an **AI matchmaker** interviews you, hand-picks a few high-quality
matches with a written rationale for *why* you'd click, suggests concrete **real-world
date ideas**, and acts as a **wingman** to help you break the ice and actually meet.

## Why it's different

| Typical apps | Hearth |
| --- | --- |
| Static profile forms | A short **conversational AI interview** builds your taste profile |
| Infinite swipe feed | A few **curated matches**, each with a "why you click" rationale |
| Endless in-app chat | AI proposes **real-world activities** to get you offline |
| You're on your own | An **AI wingman** suggests openers & nudges toward meeting |

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo, TypeScript everywhere
- **Backend** (`apps/api`): Fastify + Prisma (SQLite, Postgres-ready) + JWT auth (argon2)
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`, behind a provider abstraction with a
  **`mock` mode** so the whole app runs with **no API key and no cost**
- **Web** (`apps/web`): React + Vite + TanStack Router + TanStack Query
- **Shared** (`packages/*`): `@hearth/shared` (zod schemas + deterministic compatibility
  scoring) and `@hearth/client` (typed API client + React Query hooks), reused by every client

## The matchmaking engine

Deterministic where it's cheap, AI where judgment matters:

1. **Hard filters** (gender/seeking, dealbreakers) — SQL
2. **Compatibility score** (interest overlap, values, personality, energy) — pure, tested
   functions in `packages/shared/src/scoring.ts`
3. **Claude rerank + rationale** over the top shortlist only — language & judgment
4. Results cached as `Match` rows; activities/openers cached too, so nothing is re-billed

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure the API (copy and tweak if you like; defaults work out of the box)
cp .env.example apps/api/.env

# 3. Create the database + seed 13 demo users
pnpm --filter @hearth/api db:migrate     # creates SQLite db + runs migrations
pnpm --filter @hearth/api db:seed         # seeds users incl. demo@hearth.app

# 4. Run API + web together
pnpm dev
```

- API: http://localhost:3001  (health: `/health`)
- Web: http://localhost:5173

**Demo login** (pre-filled on the sign-in screen):
`demo@hearth.app` / `password123` — already has a mutual match + chat with "Marco".
Hit **Refresh** on the Matches page to generate the rest.

> By default `AI_PROVIDER=mock`, so no Anthropic key is needed. To use real Claude, set
> `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=...` in `apps/api/.env`.

## Useful commands

```bash
pnpm dev                 # run all apps (Turborepo)
pnpm test                # run unit tests (compatibility scoring, etc.)
pnpm typecheck           # typecheck every package
pnpm --filter @hearth/api db:reset   # wipe + re-migrate + re-seed
```

## Project layout

```
apps/
  api/     Fastify backend (auth, interview, matchmaker, activities, chat, wingman)
  web/     React + Vite client (login, onboarding, matches, match detail, chat)
packages/
  shared/  zod schemas, enums, deterministic compatibility scoring (+ tests)
  client/  typed API client + TanStack Query hooks (shared across clients)
```

## Roadmap / deferred for the MVP

Mobile (Expo) client · real geolocation · websockets (chat polls today) · push
notifications · photo upload + moderation · payments · OAuth · vector embeddings.
These are intentionally out of scope; see the in-repo plan for the upgrade path.
