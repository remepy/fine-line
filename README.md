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

## QA: running a build locally

```
pnpm --filter @workspace/fine-line build:languages
pnpm --filter @workspace/fine-line serve
```

`scripts/serve.mjs` serves the built bundles at the same paths S3 does, with
the same cache headers, and does no clean-URL rewriting — a redirect from
`/he/index.html` to `/he/` would break the relative `./translations.json`
fetch.

- `…/he/index.html` — standalone, exactly what QA sees opening a build URL.
- `…/he/index.html?bridge=1` — with a stand-in for the Flutter host: it
  answers `game_ready` with a `session_start` and prints every message the
  game posts, in a panel bottom-left and in the console.

Useful parameters on the `?bridge=1` URL: `rounds=N`, `levels=a,b,c`,
`tutorial=0`, `locale=en-US` (to check BR-14 from the Hebrew build),
`delay=6000` (to check the five-second timeout), `reducedMotion=1`. From the
console, `__host.send("pause")`, `"resume"` and `__host.send("abort", {reason:
"call"})` drive the rest of the app-side channel.

`tests/bridge.test.mjs` covers the same ground headlessly.
