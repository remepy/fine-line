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

- White pixels (`R>200, G>200, B>200`, `alpha >= 30`) = difference zone mask
- Anything else (including transparent pixels) = background
- Connected white pixels are grouped into zones via BFS (8-neighbour)
- Zones with fewer than 4 pixels are filtered as noise
- Hit detection (`src/lib/hitmap.ts:checkHit`) reads the raw pixel data and registers a hit only when there is a white mask pixel within a **5 display-pixel radius** of the tap (scaled to hitmap-pixel space via the displayed image dimensions). This is fully pixel-accurate, not bounding-box based.

### Layout & Orientation

- **Edge-to-edge images** filling the entire phone frame; UI lives as small floating overlays on top:
  - Top-right (RTL leading): title + level pill
  - Top-center: progress dots
  - Top-left (RTL trailing): score pill
  - Bottom-right: subtitle
  - Bottom-left: amber hint FAB with hint counter badge
- Safe-area insets via `env(safe-area-inset-*)` keep overlays clear of notches.
- **Forced landscape**: when the device is in portrait orientation (`@media (orientation: portrait) and (max-width: 900px)`), the entire `.rotation-wrapper` is CSS-rotated 90° via `transform: rotate(90deg) translate(0, -100%)` so the user sees the game sideways and must physically rotate the phone. The `useIsRotated` hook tracks this state, and `GameImage.handlePointerDown` converts the visual tap coords back to natural image coords when rotated.
- The viewport meta uses `viewport-fit=cover` and PWA meta tags for true full-screen on iOS/Android.

### Game Features

- Hebrew RTL UI
- Background music toggle (music-note icon next to the score pill, top-left). Two MP3 tracks loop one after the other; managed by `useBackgroundMusic` hook using a single `Audio` instance. Off by default — playback starts on the user's first toggle click (browser autoplay policy).
- Sparkle animation on correct tap, X-mark on miss (350ms)
- Ordinal numbered markers for player-found differences (8 rotating colors)
- Hint button (💡) reveals a difference with an amber marker, sharing the same numbered sequence as player taps
- Progress dots track identified differences (green=found, amber=hinted)
- Success popup appears 2000ms after the last difference is revealed
- Buttons: "לשלב הבא" / "יציאה מהמשחק"
- Markers slide+fade from tap position to the zone centroid (cubic-bezier easing)
- Session-level randomization of image sets (no repeats until exhausted)
