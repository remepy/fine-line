# Fine Line — Cyan WebView integration (bridge v1, revision B)

## Binding

| | |
|---|---|
| `gameId` | `fine-line` |
| URL | `https://<cdn>/games/fine-line/{lang}/index.html` |
| Level catalogue | 19 fixed levels, `fine-line-001`…`fine-line-019` |
| Rounds per session | 3 |
| `stats` keys | `totalTaps`, `wrongTaps`, `hintsUsed` (int) |
| Loss condition | none — every round ends `won` |

`{lang}` is `he` or `en`. The app substitutes it; the game never parses its
own URL to work out which language it is.

Each level is one pair of 1024×1024 scenes with seven differences and a
hitmap. The catalogue is fixed, so a level ID always resolves to the same
artwork. `public/image-sets/manifest.json` maps each ID to its artwork folder
(`slug`) and display name; the app only ever needs the ID.

`wrongTaps` counts taps that hit no difference; `totalTaps` counts every tap
on the board, so `wrongTaps` can be read as a share of the total rather than
in isolation. Hints are not taps. Per BR-04 the game reports no elapsed time —
the app measures round duration.

## Copy

Each build ships one self-describing `./translations.json` beside its own
`index.html`, carrying `locale`, `dir` and every UI string. The game sets text
direction from `dir` (BR-15) and reports `locale` in `game_ready`. Source
files live in `translations/{he,en}.json`; the build emits the right one.

If that file cannot be fetched, does not parse, has the wrong `locale`/`dir`,
or is missing any key, the game posts `game_error` with code
`translations_unavailable`, renders nothing, and never posts `game_ready`
(BR-13). There are no hard-coded fallback strings, so a missing key can never
render a raw key on screen.

Hebrew copy is gender-neutral throughout (BR-08). No feminine variant exists.

## App → game

Define `CyanGameBridge.postMessage` before page scripts run. The app receives:

```json
{"type":"game_ready","data":{"gameId":"fine-line","protocolVersion":1,"locale":"he-IL"}}
```

Reply within five seconds (BR-11), or the game ends the activity without
completion:

```js
window.cyanBridge.receive({
  type: "session_start",
  data: {
    protocolVersion: 1,
    sessionId: "opaque-id",
    expectedLocale: "he-IL",
    levelIds: ["fine-line-001", "fine-line-007", "fine-line-012"],
    reducedMotion: false,
    tutorialSeen: true,
  },
});
```

`expectedLocale` must match the locale this build loaded; a mismatch posts
`game_error` with code `locale_mismatch` and ends the activity (BR-14).
`levelIds` must be a non-empty ordered list of IDs from the manifest — the app
owns the pointer and may pick any subset in any order (BR-03).

The app may also send `pause`, `resume`, and `abort` with `{reason: string}`.
Pause disables input and pauses audio in place; resume continues rather than
restarting. Abort stops output immediately and posts nothing further.

## Game → app

```json
{"type":"level_completed","data":{"levelId":"fine-line-001","outcome":"won","stats":{"totalTaps":9,"wrongTaps":2,"hintsUsed":0}}}
{"type":"game_finished","data":{"lastCompletedLevelId":"fine-line-012","stats":{"totalTaps":11,"wrongTaps":3,"hintsUsed":1}}}
```

`level_completed` is posted at the end of every round including the last, then
`game_finished` once. The game shows its own success screen after every round
except the last (BR-01). Also sent: `game_exit_requested` (no data, from the
in-game quit control, which is always visible per BR-07) and `game_error` with
`{code, message}` — `message` is for app logs only and is never rendered
(BR-10).

## Standalone

With no injected bridge the page loads its own copy and plays three rounds
from the catalogue in manifest order, posting nothing (BR-09). This is the QA
path for opening a build URL in a desktop browser.

## Storage

Only a tutorial-seen flag is kept in `localStorage`, under
`fine-line-tutorial-seen`. `session_start.tutorialSeen` always overrides it
(BR-06). Nothing else persists across sessions; progression lives in the app.

## Building and hosting

```
pnpm --filter @workspace/fine-line build:languages
```

Produces `dist/languages/{he,en}/`, each compiled with its own base path.
Upload the **contents** of each to `games/fine-line/{he,en}/` on S3.

Serve `index.html` and `translations.json` as `no-cache`; content-hashed
`assets/*` as `public, max-age=31536000, immutable`. That is what lets copy be
corrected by replacing one JSON file without rebuilding or redeploying.

The Flutter app owns `{lang}` substitution and deployment; this repository
configures neither AWS nor the app.
