# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains "The Fine Line" (הקו הדק) - a Hebrew spot-the-difference mobile web game for people with Parkinson's Disease.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## The Fine Line Game (הקו הדק)

**Artifact**: `artifacts/the-fine-line` — React + Vite, served at `/`

A spot-the-difference mobile web game in Hebrew with RTL support, targeting people with Parkinson's Disease (age 60+, large UI elements for tremor tolerance).

### Architecture

- **No backend** — fully frontend, no database needed
- **Image sets**: `public/image-sets/manifest.json` — list of available sets
- **Hitmap parsing**: `src/lib/hitmap.ts` — canvas-based connected component analysis
- **Game state**: `src/hooks/useGame.ts` — loading, zones, tap detection, hints
- **Main page**: `src/pages/GamePage.tsx`
- **Components**: `GameImage`, `Sparkle`, `SuccessModal`

### Adding More Image Sets

1. Create folder `public/image-sets/<set-id>/` with `original.png`, `modified.png`, `hitmap.png`
2. Add an entry to `public/image-sets/manifest.json`
3. The hitmap should have colored (non-white) pixels marking the difference regions

### Hitmap Format

- White pixels (`R>200, G>200, B>200`) = background
- Transparent pixels (`alpha < 30`) = background
- Any other colored pixel = part of a difference zone
- Connected colored pixels are grouped into zones via BFS
- Zones with fewer than 8 pixels are filtered as noise

### Game Features

- Hebrew RTL UI
- Landscape phone-frame layout (emulates smartphone on desktop)
- Sparkle animation on correct tap (300ms)
- Ordinal numbered markers for player-found differences
- Hint button (💡) with special amber markers for revealed differences
- Progress dots track identified differences
- Success popup with "לשלב הבא" / "יציאה מהמשחק" buttons
- Generous hit detection for tremor (4% tolerance around each zone bounding box)
- Session-level randomization of image sets (no repeats)
