---
name: Cyan WebView bridge integration
description: Durable integration boundaries for The Fine Line when hosted as a static WebView game inside Cyan.
---

The game remains fully standalone when no host bridge is injected; when the host bridge exists, the app owns the ordered session level list and the game waits for that session before rendering gameplay. The game never writes progression.

**Why:** The same static build must work in desktop browser QA and as one of several independently deployed WebView games, while avoiding competing sources of truth for clinical protocol progression.

**How to apply:** Treat the attached bridge specification as the protocol contract; preserve exactly-once, ordered round completion and fail-closed handshake behavior. Keep build URLs relative to Vite's configured base so CloudFront root and prefixed hosting both work. Future session changes should be tested in both embedded and standalone modes. The app-side stat-label mapping and analytics event shape were not defined in the draft, so do not invent wire messages for them without coordinating the contract.

For the revision B localization contract, the app chooses a language-specific URL; copy and text direction must come from that page's same-origin translation file before the bridge announces readiness. The session's expected language is only a cross-check. Never restore fallback strings or app-supplied translation URLs.

**Why:** A mismatched URL or missing copy must fail without showing language from the wrong build, and copy corrections should not require rebuilding game code.

**How to apply:** Keep translation files self-describing and complete, with no player-visible hard-coded title or copy before validation. Build each language with its own static asset prefix and keep externally fetched fonts out of the WebView build.