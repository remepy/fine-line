# Fine Line

A spot-the-difference game for the Cyan arm of the Remepy Parkinson's daily
protocol. Two 1024×1024 painted scenes side by side, seven differences, tap
either image to mark one. Built as a static site, hosted on S3/CloudFront and
opened full-window as a WebView by the Flutter app.

`artifacts/fine-line/BRIDGE.md` is the integration contract: gameId, level
catalogue, stats keys, message flow and hosting layout. Read it before wiring
the game into the app.

## Layout

```
artifacts/fine-line/
  src/                    game code
  translations/           he.json, en.json — the only place copy lives
  public/image-sets/      artwork and hitmaps, plus manifest.json
  asset-sources/          original PNGs the WebP artwork is derived from
  scripts/                per-language build
  tests/                  bridge and copy tests
deliverables/             level-maker PRD
```

## Working on it

```
pnpm install
pnpm run typecheck
pnpm --filter @workspace/fine-line test
PORT=5173 pnpm --filter @workspace/fine-line dev
```

Dev serves Hebrew by default; set `VITE_GAME_LANGUAGE=en` for the English
build. There is no bridge in dev, so the game runs standalone: three rounds
from the catalogue, no messages posted.

## Building for S3

```
pnpm --filter @workspace/fine-line build:languages
```

Writes `dist/languages/he/` and `dist/languages/en/`, each with its own base
path baked in and its own `translations.json`. Upload the contents of each to
`games/fine-line/{he,en}/`. Cache headers are in BRIDGE.md.

## Conventions

- Levels are addressed by catalogue ID (`fine-line-001`…), never by index.
  The app persists `lastCompletedLevelId`, so IDs are permanent once a
  participant has played.
- All copy lives in `translations/`. Nothing user-facing is hard-coded, and
  there are no fallback strings — a missing key fails the load rather than
  rendering itself on screen.
- Hebrew copy is gender-neutral: plural imperatives (`לחצו`), nouns rather
  than singular imperatives (`דילוג`, not `דלג`).
- No identifier, key, path, asset name or log line may carry arm-identifying
  vocabulary. This is a blinded trial; the word for this arm is "Cyan".

## Testing a session without the app

`tests/bridge.test.mjs` drives the bridge directly. To exercise a real build,
serve `dist/languages/` at the matching path and inject a
`CyanGameBridge.postMessage` stub that replies to `game_ready` with a
`session_start` — `game_ready` arrives only after copy has loaded.
