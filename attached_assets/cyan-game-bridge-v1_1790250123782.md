# Cyan Game Bridge — v1

**Status:** draft for review · **Date:** 2026-09-23 · **Owners:** Ran (product), Guy (engineering)
**Supersedes:** the one-way bridge described in the Cyan daily content authoring guide.

---

## 1. Purpose and scope

Defines the interface between the Cyan app (Flutter) and the six web games hosted as
static sites on S3/CloudFront and loaded full-window in a WebView.

The current guide defines two messages, both game → app. This version adds an app → game
channel so the app can configure a session, and adds the lifecycle and failure behaviour
that six independently-deployed games need in order to behave identically.

Out of scope: the daily protocol itself, audio activities, the pre-page and summary screens
(all app-owned), and the internal design of any individual game.

---

## 2. Transport

| Direction | Mechanism |
|---|---|
| Game → app | `CyanGameBridge.postMessage(JSON.stringify({ type, data }))` |
| App → game | `window.cyanBridge.receive({ type, data })`, defined by the game before it signals ready |

Every message is a `{ type, data }` object. `data` MAY be omitted where the table below
shows no fields.

---

## 3. Messages: app → game

### `session_start`
Sent once, in reply to `game_ready`. Carries everything the game needs for the whole session.

| Field | Type | Notes |
|---|---|---|
| `protocolVersion` | int | `1` |
| `sessionId` | string | Opaque; echoed in analytics |
| `locale` | `"he-IL"` \| `"en-US"` | See BR-08 |
| `translations` | object \| string | Key/value map, or a URL the game fetches |
| `levelIds` | string[] | Ordered, one entry per round in this session |
| `reducedMotion` | bool | Mirrors the app's own animation setting |
| `tutorialSeen` | bool | Authoritative; overrides anything the game stored |

### `pause` / `resume`
No data. Sent on backgrounding, incoming call, or any app-side interruption.

### `abort`
`{ reason: string }`. The app needs the round to end immediately. The game stops audio and
input and posts nothing further.

---

## 4. Messages: game → app

### `game_ready`
`{ gameId: string, protocolVersion: int }` — posted once the page has loaded and
`window.cyanBridge.receive` is defined, before rendering any content.

### `level_completed`
`{ levelId: string, outcome: "won" | "lost", stats: object }` — posted at the end of every
round, including the last.

### `game_finished`
`{ lastCompletedLevelId: string, stats: object }` — posted after the final round in
`levelIds`. This is what ends the activity and advances the day.

### `game_exit_requested`
No data. The participant used the game's own quit control. The activity ends **without**
being marked complete, so the protocol offers it again.

### `game_error`
`{ code: string, message: string }` — unrecoverable state. `message` is for logs only and is
never rendered (see BR-10).

---

## 5. Lifecycle

```
game_ready → session_start → [ round → level_completed ] × N → game_finished
                                  ↑                              ↓
                            pause / resume            app shows summary, day advances
```

At any point: `game_exit_requested` or `game_error` ends the activity without completion.

---

## 6. Normative requirements

| ID | Requirement |
|---|---|
| **BR-01** | The app MUST send the complete `levelIds` list in `session_start`. The game therefore knows which round is last and MUST show its own success screen after every round except that one. No mid-session "next round is the last" message exists. |
| **BR-02** | A lost round is a completed round. `outcome` is reported for statistics only; progression MUST NOT depend on it. |
| **BR-03** | The app owns the level pointer. It persists `lastCompletedLevelId` and computes the next `levelIds`. A game MUST NOT treat its own storage as the source of truth for progression. |
| **BR-04** | The app measures round duration. Games MUST NOT report elapsed time. |
| **BR-05** | `stats` is an open key/value map. Each game declares its own keys; the app maps keys to display labels **per `gameId`**, so games do not share one label namespace. |
| **BR-06** | A game MUST persist nothing across sessions except a tutorial-seen flag, and MUST prefer `session_start.tutorialSeen` when present. |
| **BR-07** | A game MUST provide a visible quit control, because the app draws no chrome and the page occupies the full window including the area behind the status bar. |
| **BR-08** | Hebrew copy MUST be gender-neutral in every game. The app MUST collapse the feminine Hebrew locale to `he-IL` before `session_start`. A game receiving an unrecognised locale MUST fall back to `he-IL` rather than raising `game_error`. |
| **BR-09** | A game MUST render correctly with no bridge present (QA opening the URL in a desktop browser): it runs standalone with defaults and posts nothing. |
| **BR-10** | **Blinding.** No identifier, translation key, log line, error message, URL path or asset name may contain arm-identifying vocabulary — including "placebo", "sham", "control", "mock", "demo", "dummy" or their Hebrew equivalents. `game_error.message` MUST NOT be rendered to a participant, because a missing translation key renders the raw key on screen. |
| **BR-11** | If no `session_start` arrives within 5 seconds of `game_ready`, the game MUST behave as though `game_error` were posted: end the activity without completion. |

---

## 7. Solitaire binding (worked example)

| | |
|---|---|
| `gameId` | `solitaire` |
| Level catalogue | 180 fixed deals, wrapping after 180 |
| Rounds per session | 2 |
| `stats` keys | `wins` (int), `rounds` (int) |

Every deal is solvable with perfect play; the catalogue is calibrated so heuristic play wins
about one third of deals. Following the in-game hint repeatedly clears any board.

---

## 8. Changes from the current draft

1. **An app → game channel is added.** Localisation, level selection, interruption handling
   and the tutorial flag all require it; none were expressible before.
2. **`LastGameID` is renamed `lastCompletedLevelId`** and moves to the app. The original term
   was ambiguous between game and level, and did not say who stored it.
3. **The "alert the game that the next level is the last" message is removed**, replaced by
   sending `levelIds` up front — one fewer round-trip and one fewer race condition.
4. **The stat whitelist is replaced by a per-game key map.** Two fixed card labels shared
   across six games of different shapes cannot express the required statistics.
5. **The feminine Hebrew locale is not exposed to games** (BR-08).
6. **Failure behaviour is defined** (BR-09, BR-11), which the current draft leaves open.
7. **Blinding is a normative requirement** (BR-10). See PDC-5358, whose scope should be
   widened to cover the daily-content tags, key namespace and the four participant-facing
   strings currently carrying arm-identifying wording.

---

## 9. Open questions

1. **Translations: inline or URL?** A URL on an origin other than the game's own needs CORS,
   and may conflict with the WebView's same-origin navigation rule. Inline avoids both.
2. **Does the 90-second hint-flash timer pause on `pause`?**
3. **Who owns the per-`gameId` stat label mapping** — app config, or the content JSON?
4. **Multi-day scheduling (PDC-4120)** is not built. The 84-day rotation across six games
   depends on it, regardless of game readiness.
5. **App-side copy for game activities** (pre-page, summary) still uses gendered Hebrew
   variants while the games are neutral. Deferred, but it produces a register change
   mid-activity.
