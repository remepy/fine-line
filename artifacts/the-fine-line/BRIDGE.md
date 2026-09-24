# The Fine Line — Cyan WebView integration (bridge v1, revision B)

The game ID is `the-fine-line`. The Flutter WebView must inject
`CyanGameBridge.postMessage` before page scripts run. The app chooses a
language-specific URL:

```
https://<cdn>/games/the-fine-line/{lang}/index.html
```

Substitute `he` or `en` for `{lang}`. Each page fetches its own
`./translations.json` before defining `window.cyanBridge.receive` and sending
`game_ready`. This file supplies `locale`, `dir`, and every UI copy key. The game
does not determine language from the URL or from the app's session.
If the file cannot be fetched or is incomplete/invalid, it sends
`game_error` with code `translations_unavailable`, renders nothing, and does
not send `game_ready`. Copy and URL paths must not reveal participant groups.

## App → game

The app receives `game_ready` with
`{gameId:"the-fine-line",protocolVersion:1,locale:"he-IL"}` (or `"en-US"`).
Send `session_start` within five seconds:

```js
window.cyanBridge.receive({
  type: "session_start",
  data: {
    protocolVersion: 1,
    sessionId: "opaque-id",
    expectedLocale: "he-IL",
    levelIds: ["walk-in-park", "seaside-terrace"],
    reducedMotion: false,
    tutorialSeen: true,
  },
});
```

`expectedLocale` must match the locale loaded by the page. Mismatch sends
`game_error` with code `locale_mismatch` and ends play. The app must not send
`locale` or `translations` in the session; the game never fetches
translations from an app-supplied URL. `levelIds` must be a nonempty ordered
list of IDs in `public/image-sets/manifest.json`. The app owns the level
pointer and may select any subset and order. It can also send `pause`,
`resume`, or `abort` (with `{reason: string}`).

## Game → app

The injected handler receives JSON strings, for example:

```json
{"type":"game_ready","data":{"gameId":"the-fine-line","protocolVersion":1,"locale":"he-IL"}}
{"type":"level_completed","data":{"levelId":"walk-in-park","outcome":"won","stats":{"differencesFound":7,"hintsUsed":0,"misses":0}}}
{"type":"game_finished","data":{"lastCompletedLevelId":"seaside-terrace","stats":{"differencesFound":7,"hintsUsed":0,"misses":0}}}
```

Other messages: `game_exit_requested` (no data) and `game_error` with
`{code, message}`. Error messages are for app logs only and are never
rendered. This game has no loss condition: every round ends in `won` after
all differences are found. It emits `level_completed` for every round,
including the last, then `game_finished`; the last round has no in-game
success screen. `stats` keys are game-specific. The app measures duration.
The `sessionId` is accepted but no analytics event is emitted because the
draft does not define one; the host should associate messages with its
current session.

With no injected bridge, the page still fetches its own translations and
plays all levels in manifest order. It posts nothing. In a WebView it does
not show gameplay until the session is received; no session within five
seconds sends `game_error` and disables play. `abort` and in-game quit stop
output without completion. Only the tutorial-seen flag is stored locally;
the app's `tutorialSeen` value always overrides it.

## Static hosting

Run `pnpm --filter @workspace/the-fine-line build:languages`. Upload the
**contents** of `artifacts/the-fine-line/dist/languages/he/` to
`games/the-fine-line/he/` on S3, and likewise `dist/languages/en/` to
`games/the-fine-line/en/`. Both builds have the corresponding absolute
asset base baked in. Keep each `translations.json` and `image-sets/`
directory alongside that language's `index.html`. The existing `build`
command still produces the Hebrew-at-root Replit preview in `dist/public/`.

The editable source files are `public/translations.json` (Hebrew) and
`translations/en.json` (English). To update copy on S3 without rebuilding,
replace the appropriate deployed `translations.json` only, preserving its
`locale`, `dir`, and all keys. Serve `index.html` and `translations.json`
with `Cache-Control: no-cache`; content-hashed `assets/*` can use
`public, max-age=31536000, immutable`. Invalidate other changed catalogue
files as needed. The Flutter app owns URL-template substitution and
deployment; this repository does not configure AWS or the app.