# The Fine Line — Cyan WebView integration

This game implements the attached Cyan Game Bridge v1 draft. Its `gameId` is
`the-fine-line`. The Flutter WebView must inject `CyanGameBridge.postMessage`
**before page scripts run**. The game defines `window.cyanBridge.receive`
before posting `game_ready`. Send `session_start` within five seconds of
`game_ready`; do not navigate to a different origin to deliver messages.

## App → game

Invoke `window.cyanBridge.receive({type, data})` with a JavaScript object:

```js
window.cyanBridge.receive({
  type: "session_start",
  data: {
    protocolVersion: 1,
    sessionId: "opaque-id",
    locale: "he-IL",
    translations: {}, // inline key/value strings preferred; URL also supported
    levelIds: ["walk-in-park", "seaside-terrace"],
    reducedMotion: false,
    tutorialSeen: true,
  },
});
```

`levelIds` must be a nonempty ordered list of IDs in
`public/image-sets/manifest.json`. The app owns the pointer; it may select
any subset and order. The game never persists progression. An unsupported
locale falls back to `he-IL`. Translation keys are in `src/lib/copy.ts`;
unknown keys are never shown to participants. An external translations URL
must be fetchable by the WebView (including CORS). The app can also send
`pause`, `resume`, or `abort` (with `{reason: string}`).

## Game → app

The injected handler receives JSON strings, for example:

```json
{"type":"game_ready","data":{"gameId":"the-fine-line","protocolVersion":1}}
{"type":"level_completed","data":{"levelId":"walk-in-park","outcome":"won","stats":{"differencesFound":7,"hintsUsed":0,"misses":0}}}
{"type":"game_finished","data":{"lastCompletedLevelId":"seaside-terrace","stats":{"differencesFound":7,"hintsUsed":0,"misses":0}}}
```

Other messages: `game_exit_requested` (no data) and `game_error` with
`{code, message}`. Error messages are for app logs only. This game has no
loss condition: every round ends in `won` when all differences are found.
It emits `level_completed` for every round including the last, then
`game_finished`; the final round has no in-game success screen. `stats`
keys are specific to this game. The app measures duration. The `sessionId`
is accepted but no analytics event is emitted because the draft does not
define one; the host should associate messages with its current session.

Without an injected bridge the game remains playable in a browser, with
all levels in manifest order. In a WebView it does not start gameplay until
the session is received; no session within five seconds causes `game_error`
and disables play. `abort` and in-game quit stop output without completion.
Only the tutorial-seen flag is stored locally, and the app's
`tutorialSeen` value always overrides it.

## Static hosting

Run `pnpm --filter @workspace/the-fine-line build`. Upload the **contents**
of `artifacts/the-fine-line/dist/public/` to the S3 origin and serve
`index.html` at the game root via CloudFront. Keep `image-sets/manifest.json`
and its PNGs alongside the built JS/CSS assets. If hosted under a prefix,
set `BASE_PATH` to that prefix (ending in `/`) at build time. Do not load
assets via the Replit development domain. For updates, invalidate cached
`index.html` and `image-sets/manifest.json` on CloudFront.