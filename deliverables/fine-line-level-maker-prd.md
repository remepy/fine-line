# The Fine Line — Level Maker

## Product requirements document

Version: 1.0  
Date: 18 September 2026  
Status: Ready for owner review and Replit implementation scoping  
Owner and approver: Content manager / project owner  
Audience: Replit Agent building a separate project

This document replaces and expands the supplied “Fine Line Level Maker” requirements. It preserves the requested workflow and adds a self-contained compatibility contract for The Fine Line game. It is not a request to modify or rebuild the existing game.

### Decision record

- Confirmed by the owner: desktop/laptop editor only.
- Confirmed by the owner: seven differences per level by default; editable per level.
- Confirmed by the owner: AI automatically chooses an appropriate visible replacement; no per-edit instruction field is required.
- Confirmed by the owner: use a verified available image model that meets the requirements; the original model names are not mandatory.
- Proposed implementation defaults: one content manager, English editor interface, Unicode level titles, one level edited at a time, and manual ZIP transfer to the separate game project. These are assumptions, not additional confirmed preferences.
- Initial revision: incorporates the original requirements, owner clarifications, inspection of the current game, and provider documentation reviewed on the date above.

## 1. Problem and objective

Creating each spot-the-difference level currently requires image generation, careful local editing, construction of a matching hitmap, file naming, and game registration. Repeating this manually is slow and risks producing levels with invisible differences, incorrect hit areas, or unrelated changes.

Build a standalone desktop web app that automates repetitive work while leaving scene selection, difference placement, and final approval to a human content manager. The generator must produce playable assets for the existing game without requiring changes to its runtime.

The practical alternative is a general-purpose image editor plus manually prepared masks and folders. This product adds game-specific validation and repeatable exports, not a full replacement for Photoshop or a general AI art platform.

### Success measures

- Generate four candidates, open any candidate, create seven approved differences, and export a compatible level without external image editing.
- Every game-ready export passes the structural and pixel-integrity checks in this document.
- A manager can create several levels across multiple batches and export selected completed levels together.
- Saved drafts and completed assets survive reloads and application restarts.
- Measure generation time separately from hands-on editing time. Do not promise a fixed AI response time or cost before testing the selected service.

## 2. Scope and essential additions

### Required by the source document

- Hidden-by-default, editable generation prompt built from the supplied style.
- Four square 2048 × 2048 candidates, each displayed as a 512 × 512 preview.
- Separate editing window: edited image on the left, immutable original on the right.
- Per-image zoom buttons, with 5-percentage-point increments.
- Collapsible left tool panel; circular 100% eraser with radius from 1 to 100 image pixels.
- Checkerboard display for erased pixels; cumulative PNG hitmap.
- Undo/redo with a 20-action history and keyboard shortcuts.
- AI “Complete” to fill erased areas with stylistically appropriate changes.
- Save original, modified, and hitmap PNGs with descriptive `_A`, `_B`, and `_Hitmap` names.

### Only three additional product features are proposed as essential

1. **Autosaved drafts and a minimal level library.** Keep generated candidates, in-progress work, completed levels, and a multi-level export selection. Without this, creating multiple levels efficiently is fragile.
2. **Game-size preview and export validation.** Test taps, zone count, small differences, and control-obscured regions before publishing assets to the game.
3. **Accept/reject/retry for AI results.** A generated edit is a proposal, not an automatic overwrite. Preserve the last good version and make chargeable retries explicit.

Game-ready packaging, mask separation, pixel compositing, access protection, and job recovery below are correctness requirements supporting these features—not separate expanded modules.

### Non-goals

- No mobile/tablet authoring, native app, or phone-rotation component.
- No changes to the existing game, its scoring, hints, orientation behavior, or deployment.
- No direct publishing into the game project, shared database, or cross-project API.
- No unattended generation of finished levels: humans choose every edit region and approve every result.
- No full layer editor, arbitrary drawing tools, text placement, or general image manipulation suite.
- No teams, roles beyond an authorized manager, public gallery, marketplace, payments, analytics dashboard, or difficulty-ranking system.
- No import of arbitrary images or legacy editable projects in the first version. Importing an existing game manifest for safe export merging is included.

## 3. End-to-end workflow

1. Open the generator and press **Generate**. The app creates four varied scene prompts using the fixed style; the prompt area stays collapsed unless expanded.
2. View four 512px candidate previews as they finish. Retain all successful candidates in the library.
3. Press **Edit** on a candidate to create or reopen its level draft in a separate editor window.
4. Review the original at right. Erase a connected region on the left where a difference should appear.
5. Press **Complete**. AI proposes a visible, coherent change within the selected region.
6. Review the proposal, then **Accept**, **Reject**, or **Retry**. Repeat until the target number of differences is achieved.
7. Inspect the cumulative hitmap and test the level at game size.
8. Save the level and download the descriptively named PNGs or the game-ready ZIP.
9. Return to the library, edit more candidates, and export multiple approved levels in one ZIP.

The manager can erase several separate regions before Complete, but editing one difference at a time is the recommended workflow for easier review.

## 4. Image generation and prompts

### GEN-01 — Batch generation

- Each Generate action creates exactly four candidate slots, targeting four distinct images at native 2048 × 2048 resolution.
- Generate varied scenes rather than four accidental duplicates. With the prompt panel collapsed, select scene topics automatically.
- Preserve the requested visual style across batches. Keep subjects, arrangements, and small stories varied.
- Show each slot as queued, generating, ready, or failed. Partial failures do not discard successful images.
- The app may use several provider requests if a single four-image request is unsupported.
- Never silently upscale a lower-resolution result and label it native 2048px. Reject an unexpected size or request an explicitly approved alternative if the selected service cannot deliver it.

### GEN-02 — Prompt controls

- Collapsed by default, with one primary Generate button.
- Expanding reveals the exact prompts to be submitted, including the four scene variations. The manager can edit them before submission.
- Store the submitted prompt, model identifier, output settings, and creation time with each candidate.
- A prompt can be generated from a curated scene vocabulary and a template; a separate language-model call is not mandatory.

### GEN-03 — Style reference

Use the following supplied style as the base, adapting syntax to the selected provider:

> elegant painterly editorial illustration in the style of sophisticated magazine covers, reminiscent of The New Yorker illustration style, soft gouache texture, refined European aesthetic, calm and cultured atmosphere, warm natural lighting, muted color palette. minimal but expressive linework, subtle textures, balanced composition, clear object separation, slightly stylized realism, no cartoon, no exaggerated features, high clarity, readable shapes, gentle storytelling, mid-century influence, cinematic but soft, 3/4 perspective, designed for spot-the-difference game, uncluttered, visually calm.

Add game-specific directions:

- One square, edge-to-edge scene; no side-by-side comparison, panels, border, captions, labels, watermark, logo, or numbered differences.
- Original scene only. Do not generate an original/modified pair in one request.
- Provide enough separated, recognizable objects or features to support the target number of edits without clutter.
- Favor differences that can later be recognized on a phone-sized image. Avoid micro-details as the only editing opportunities.
- Maintain useful contrast and object separation despite the muted palette.
- Leave reasonable editing opportunities away from the top and bottom edges, where game controls may overlap the artwork.
- Keep content calm, adult-appropriate, and visually readable for the game's older audience, including players with motor difficulties. Do not make therapeutic claims.

## 5. Desktop editor

### EDT-01 — Layout and navigation

- Edit opens a new browser window or tab directly from the click, so it is a user-initiated action. If the browser blocks it, provide an explicit Open Editor link.
- Edited image is always left; original is always right. Both remain square and undistorted.
- Show the largest usable side-by-side view within the available window, accounting for the tool panel.
- Start at Fit, showing both complete images. Each image has its own zoom −/+, current percentage, and Fit action.
- Zoom changes in 5-percentage-point steps, for example 100% → 105% → 110%, not multiplicative 5% scaling. Support 5%–400%, with panning when the canvas exceeds its viewport.
- Collapsing the tool panel, resizing the window, zooming, or panning must never modify asset coordinates or pixels.
- Distinguish “Target: 7”, “Accepted differences”, and “Pending regions”. Changing the target never alters an image automatically.

### EDT-02 — Eraser

- Circular brush with radius slider from 1 to 100 inclusive, measured in the 2048px source-image coordinate system.
- Show the radius value and a cursor outline immediately reflecting size and zoom.
- Click stamps a disk; drag produces a continuous stroke. A single pointer-down/up stroke counts as one undo action.
- Fully erase selected pixels in the editable working view; show checkerboard behind them. Checkerboard is display-only and must never be baked into exports or sent as scene content.
- Clip strokes to image bounds and accurately transform screen coordinates through zoom and pan, including high-DPI displays.
- Show pending mask coverage. Do not include unaccepted holes in the final game hitmap.

### EDT-03 — Undo and redo

- Retain the most recent 20 committed editing actions, not 20 pointer-move events.
- Undo/redo restores image, pending mask, accepted hitmap, and derived difference count together.
- Support Cmd+Z / Cmd+Y on macOS and Ctrl+Z / Ctrl+Y on Windows; also support Cmd/Ctrl+Shift+Z for redo.
- Do not intercept these shortcuts while typing into a text field.
- A new edit after undo clears the redo branch.
- Eraser actions and accepted AI edits are undoable; undo/redo never triggers another paid AI request.
- Persist the retained history with the draft. Use compressed deltas or disk-backed snapshots rather than holding 20 complete image sets in browser memory.

## 6. Complete: constrained AI editing

### AI-01 — Inputs and intent

- Complete is disabled if there is no pending mask or an edit job is already running.
- Send the last accepted composite image and a provider-specific mask describing only the pending region; retain the immutable original as reference/provenance.
- Automatically ask for a clearly visible change—such as removing, substituting, recoloring, or changing the shape of a selected object—while matching the surrounding scene.
- Do not merely reconstruct the erased content to look identical to the original.
- “Same image kernel” means the same source image, composition, palette, lighting, and rendering style. Do not assume a provider supports a reusable random seed or guarantees deterministic regeneration.
- Freeze the submitted revision. Do not apply a late response to a different draft or to a newer editing state.

### AI-02 — Pixel preservation is mandatory

Provider masks are guidance, not a guarantee of unchanged surrounding pixels [S1]. The app must enforce preservation itself.

Maintain three separate data structures:

- **Pending edit mask:** pixels currently selected for replacement.
- **Accepted difference mask:** union of approved difference regions across the level.
- **Provider input mask:** adapter-specific representation, which may use transparent editable pixels and opaque protected pixels. It is not the game hitmap.

When a candidate edit returns:

1. Verify output decoding, size, alignment, and opacity.
2. Construct a preview by copying candidate pixels only inside the pending region onto the pre-edit accepted image.
3. Preserve every decoded pixel outside that region exactly. This also preserves earlier accepted differences.
4. If edge blending is used, keep it entirely inside the approved region. Do not expand the edit footprint silently.
5. Do not rescale, crop, reframe, or globally recolor the accepted image to accommodate a provider response.

### AI-03 — Review and cumulative state

- Show the proposed composite against the original before it becomes accepted.
- **Accept:** commit the composite, add the pending area to the accepted mask, clear pending holes, and create one undoable action.
- **Reject:** retain the pre-edit accepted image and pending selection, allowing the manager to refine it.
- **Retry:** issue a new, explicitly chargeable request from the same pre-edit state, not from the rejected result.
- No-change regions are not accepted differences. Block a region whose decoded pixels are all identical to the original; warn about near-identical changes and require human inspection.
- Once a mask region is accepted, the manager must confirm it contains one recognizable, intentional difference. Pixel changes alone cannot prove perceptual quality.
- Pending erasures, incomplete jobs, and unreviewed candidates prevent game-ready export but must not prevent saving a draft.

## 7. Game compatibility contract

This section is normative. The other Replit project must be able to implement it without access to The Fine Line source.

### ASSET-01 — Images

- Each level contains original, modified, and hitmap PNG files, all exactly 2048 × 2048.
- Use 8-bit RGB or RGBA PNG. Original and modified exports must be fully opaque, with consistent sRGB color handling and no orientation metadata that changes their interpretation.
- All files share one pixel coordinate system and identical composition boundaries.
- The original is immutable after selection. Work at full resolution; 512px previews are never export sources.
- Equality checks compare decoded pixel values, not compressed PNG bytes.
- Outside the final accepted mask, the original and modified pixels must be identical.

Current-game note: its source images are square and generally 2048px; one existing modified asset is 1024px. That legacy inconsistency is not a generator precedent. Normalize all new exports to the stricter contract above.

### MASK-01 — Exact game hitmap

- Hit region: opaque white `RGB(255,255,255)`.
- Background: opaque black `RGB(0,0,0)`.
- Use a binary mask: no colored IDs, labels, grey antialiasing, gradients, checkerboard, or transparency.
- This satisfies the game's current predicate: alpha ≥ 30 and red, green, and blue each > 200.
- The game identifies zones using **8-neighbor connected components**. Horizontal, vertical, and diagonal white-pixel contact all join regions.
- Components smaller than four pixels are ignored by the game. The generator must reject such stray components rather than silently export uncounted fragments.
- Each intended difference must be one connected region; different intended differences must not touch, even diagonally.
- Disconnected marks count as separate differences even if they were painted during one eraser gesture. Multiple touching gestures count as one.
- No entire-image white masks, empty masks, or marks without an actual visible difference.
- Do not derive the final hitmap solely from a global AI pixel-difference operation. Use reviewed editing regions; validate actual changes against them.

### MASK-02 — Count and tap behavior

- The game derives its total difference count from connected components; it does not read a supplied count or list of coordinates.
- Require final connected-component count to match the manager's selected target, default seven.
- Show live numbered component overlays so accidental splits and merges are immediately visible.
- The game uses mask pixels, not rectangular bounding boxes, for tap detection.
- Hit testing has a 5-display-pixel circular tolerance, scaled independently into hitmap X and Y coordinates. Among eligible, unrevealed mask pixels in that area, the nearest pixel determines the hit.
- Found regions are excluded from subsequent hit searches. Hints reveal an unrevealed zone; markers are placed at its white-pixel centroid.
- The parser scans in row-major order to assign zone IDs, then sorts zones by descending area for display/hints. Match this in the preview if displaying hint order and marker numbering.
- Do not enlarge the exported mask to duplicate the game's tolerance. Preview tolerance separately.

### MASK-03 — Correctness versus usability

The four-pixel threshold is a technical minimum, not a usability recommendation. For this audience, small and low-contrast differences can be inappropriate even when technically valid.

- Warn about tiny, very thin, low-contrast, or closely spaced target regions at phone display size.
- Use a conservative initial warning when a region's displayed bounding width or height is below 24 CSS pixels. This is a review heuristic, not a claim that a bounding box is the tap target.
- Allow the manager to acknowledge usability warnings after preview; never allow overrides of structural, pixel-integrity, or target-count failures.

## 8. Game-size preview and validation

### QA-01 — Play preview

- Provide a preview separate from the full-resolution editing view, with both images displayed at equal scale in a landscape frame.
- Include a default 852 × 393 CSS-pixel frame and a smaller 667 × 375 frame to expose small-screen issues. These are test layouts, not claims of exact device rendering.
- Scale the images and hit tests as the current game does. Respect the aspect ratio; never stretch.
- Support tapping either image, found-region markers, progress count, hint, completion, and Reset Preview. These actions never mutate authoring data.
- Show the game-control footprints: title at top-right, progress at top-center, score/music/fullscreen controls at top-left, hint at bottom-left, subtitle at bottom-right.
- Provide a control-overlap guide and warn if a difference can be obscured or its only useful tap area blocked. Layout varies with browser chrome and safe areas; a preview warning is not a universal device guarantee.
- A hitmap overlay toggle lets the manager compare the white regions with the actual changes. A blink comparison between original and modified supports visual review.

### QA-02 — Export gate

Block game-ready export for:

- Missing, undecodable, wrong-sized, non-square, misaligned, or non-opaque artwork.
- Pending holes, outstanding edit proposals, or active edit jobs.
- Empty/non-binary masks, stray components under four pixels, or component-count mismatch.
- Any decoded-pixel change outside the approved mask.
- Any accepted component with no pixel change relative to the original.
- Invalid/duplicate level IDs or broken manifest paths.

Show actionable errors and highlight relevant regions. Keep draft saving available. Do not silently “fix” masks, delete regions, or substitute image results to force a pass.

## 9. Saving, library, and recovery

- Minimal library: candidate preview, level title, status, target/final count, last saved time, Open Editor, and export selection. No analytics dashboard.
- Suggested states: Candidate → Draft → Ready → Exported. A new edit to a ready/exported level returns it to Draft.
- Autosave committed actions promptly; debounce rapid strokes. Display Saving, Saved, or Save failed truthfully.
- Preserve immutable original, accepted composite, pending mask, accepted mask, current proposal, retained history, and job references.
- Reloading or reopening an editor restores the last confirmed saved state. Warn on navigation when unsaved changes remain.
- Retain completed generation/edit outputs in durable storage, not only an expiring provider URL or browser memory.
- Do not let an older editor tab overwrite a newer revision; detect conflicts and require reopening the latest saved version.
- Provide explicit Save Draft and Save & Download actions. Saving a draft with holes is permitted; downloading game-ready assets with holes is not.

## 10. Downloads and transfer into The Fine Line

### EXP-01 — Descriptive PNG downloads

Suggest a short content description that the manager can edit. Derive a filesystem-safe, stable, unique slug with a suffix when needed.

For a level named “Quiet Flower Stall,” export:

```text
quiet-flower-stall_A.png
quiet-flower-stall_B.png
quiet-flower-stall_Hitmap.png
```

`_A` is original; `_B` is modified; `_Hitmap` is the binary game mask. Offer one ZIP containing all three as well as individual downloads.

### EXP-02 — Game-ready ZIP

Support one or multiple selected Ready levels. Use canonical lowercase filenames and relative manifest paths:

```text
fine-line-levels.zip
  image-sets/
    quiet-flower-stall/
      original.png
      modified.png
      hitmap.png
    another-level/
      original.png
      modified.png
      hitmap.png
  manifest.entries.json
  IMPORT-INSTRUCTIONS.md
```

`manifest.entries.json` contains a JSON array, not an object wrapper:

```json
[
  {
    "id": "quiet-flower-stall",
    "name": "Quiet Flower Stall",
    "original": "image-sets/quiet-flower-stall/original.png",
    "modified": "image-sets/quiet-flower-stall/modified.png",
    "hitmap": "image-sets/quiet-flower-stall/hitmap.png"
  }
]
```

- Paths have no leading slash and do not include `public/`.
- Human-readable names can contain Hebrew or other Unicode text. IDs and folder names should use stable lowercase ASCII slugs.
- Do not emit ZIP paths containing `..`, absolute paths, or unsafe names.
- No external storage URLs, provider URLs, credentials, or generator-specific runtime dependencies belong in the game manifest.
- Extra authoring metadata stays in generator storage, not in fields the game needs to read.

### EXP-03 — Preserve existing game levels

The current game does not discover folders automatically; it fetches `public/image-sets/manifest.json`.

- The default ZIP contains **manifest entries**, not a replacement manifest that would erase existing levels.
- Optionally let the manager upload the game's existing manifest. Validate its array structure and required fields, preserve its existing entries and order, and append new entries.
- On ID or path collision, block the merge and offer to assign a new ID to the new level; do not overwrite an existing level automatically.
- Only after a successful merge may the ZIP include a complete `image-sets/manifest.json`. Existing asset folders need not be duplicated in the ZIP.
- Include instructions: copy new folders into the game's `public/image-sets/`; merge the entries into its manifest, or use the safely merged manifest after backing up the current one; then preview and republish the game.
- The generator does not access, modify, or publish the game project itself.

## 11. Model and Replit implementation requirements

### MODEL-01 — Verified capabilities, not assumed names

Recommended starting option: **OpenAI `gpt-image-2` through Replit AI Integrations**, subject to testing the actual route in the new project.

Rationale: Replit's published list includes `gpt-image-2` [S2], and OpenAI documents 2048 × 2048 output and image editing for it [S1, S3]. This recommendation is based on documentation, not an executed integration test.

OpenAI also documents the original names `gpt-image-2.5-sunburst` and `gpt-image-2.5-flare`, recommending Sunburst where editing precision matters and Flare for faster general generation [S1]. Their availability through the selected Replit integration has not been established. They are permitted alternatives, not mandatory IDs.

Before building the full editor, verify in the new project:

1. Authenticated generation of a native 2048 × 2048 PNG.
2. Masked editing with an existing source PNG and a mask of matching dimensions.
3. A valid response that can be decoded, composited, and preserved in durable storage.
4. Model/route limits for input bytes, masks, output size, quality, batching, timeouts, and rate limits.
5. Actual model access and an understandable cost estimate at the selected settings.

Prefer one verified model for generation and editing. Do not silently switch providers, reduce resolution, or fabricate images when capabilities are missing. Present a clear setup limitation and an available alternative.

For custom dimensions, the reviewed OpenAI guide lists dimensional constraints that admit 2048 × 2048, but notes resolutions above 2560 × 1440 as experimental [S1]. Treat 2048-square performance and quality as a qualification risk; validate them explicitly.

### TECH-01 — Suggested architecture for a separate Replit project

- React + TypeScript desktop frontend with a canvas-based editor.
- Server-side AI calls and image validation/compositing; no provider credentials in browser code.
- Replit App Storage for durable PNGs, masks, proposals, and revision snapshots [S4].
- A database for candidate/level metadata, revision pointers, jobs, export status, and ownership [S5].
- Persisted job states so generation can finish independently of an open editor window. Display progress without holding a fragile browser request open for the entire operation.
- Long-running jobs need real persistence and recovery; an in-memory promise alone is not sufficient.
- The generated game assets are static files. The existing game needs no connection to this database or storage service.
- These are requirements for the new project only. Do not provision services or change the game while preparing this PRD.

### TECH-02 — Security and operational safeguards

- Restrict editing, storage, exports, and chargeable endpoints to the authorized manager. Protect server routes, not just visible controls. Use managed authentication or a verified private-app access boundary; do not invent local password authentication.
- Check Replit integration options before requesting provider credentials. Where supported, use managed AI access; otherwise obtain approval and use secure server-side secrets.
- Validate file decoding, dimensions, manifest contents, and request sizes. Enforce ownership of stored assets and revisions.
- Prevent duplicate submission from double-clicks and track request IDs. Retain successful batch slots during failures.
- Retry known transient failures with bounded backoff. For ambiguous timeouts, reconcile provider/job status where possible before repeating a paid request.
- Clearly label manual retries as new generation work. Show estimated cost when supported, or state that the estimate is unavailable; never invent exact prices.
- Cancellation prevents queued work and ignores obsolete outputs safely. Do not promise cancellation stops a chargeable request already running at the provider.
- Persist errors with useful diagnostics, but never expose credentials or raw private asset URLs in public logs.

## 12. Acceptance scenarios

### A1 — Batch and prompt fidelity

Given a new session with the prompt collapsed, when Generate is pressed, then four candidate slots appear and four successful outputs are native 2048 × 2048 PNGs with 512px previews. When prompts are edited before submission, the stored submitted prompts match those edits.

### A2 — Partial generation failure

Given three successful candidates and one failed request, when the failed slot is retried, then the three existing candidates remain unchanged and only the failed slot receives new work.

### A3 — Brush coordinates

Given an image at Fit, 100%, and 200% zoom with different pan offsets, when a radius-50 stroke targets the same source location, then the mask covers the same source pixels in every view. The preview cursor scales correctly and checkerboard never enters exported artwork.

### A4 — Undo integrity

Given eraser strokes and accepted AI edits, when undo/redo is used by button or shortcut, then the artwork, pending areas, hitmap, and counts return together to the corresponding state for the retained 20 actions. No AI requests are triggered.

### A5 — AI drift containment

Given an AI candidate that changes the entire scene, when a small pending region is composited, then every decoded pixel outside that pending region remains identical to the pre-edit image. Earlier differences remain intact.

### A6 — Reject and recover

Given a generated proposal, when Reject is pressed or the request fails, then no accepted image or hitmap changes. The pending region is retained. Reloading after a confirmed save restores that state.

### A7 — Mask semantics

Given seven connected white regions, each at least four pixels and mutually separated, when parsed, then the game-compatible count is seven. Two diagonally touching regions count as one; a three-pixel fragment fails validation; a non-binary mask fails validation.

### A8 — Perceptual and structural approval

Given a seven-region mask, when one region has no image change, changes exist outside the mask, or an erasure remains unfilled, then game-ready export is blocked. A very small but structurally valid difference produces a visible review warning rather than a false guarantee of accessibility.

### A9 — Play test

Given a validated level at both preview sizes, when the manager taps white regions or within the 5-display-pixel tolerance, then the expected unrevealed zone is found; taps beyond tolerance miss. Repeated taps do not inflate progress, hints reveal remaining zones, and all target differences can be completed.

### A10 — Export compatibility

Given several approved levels, when a game-ready ZIP is downloaded, then each level has three correctly named PNGs and valid relative manifest entries. Extraction requires no renaming of game assets.

### A11 — Safe manifest merge

Given an existing manifest and new levels, when merged export is requested, then existing entries remain present and ordered. Conflicting IDs/paths block the merge until resolved; default entry-only exports cannot overwrite the existing manifest.

### A12 — Persistence and access

Given a saved draft and a running job, when the app or editor restarts, then saved data and job status are recoverable. Unauthenticated requests cannot generate images, edit levels, or download private source assets.

## 13. Delivery and implementation order

1. Qualify the provider's real generation/editing route and 2048px output; demonstrate one precisely composited change.
2. Implement the binary-mask validator and an independent game-compatible export fixture before relying on AI output.
3. Build the batch library and editor with correct brush coordinates and atomic undo/redo.
4. Add Complete review, cumulative masks, autosave, and job recovery.
5. Add game-size play testing, validation gates, descriptive downloads, and safe single/multi-level ZIP export.
6. Verify the acceptance scenarios in current desktop Chrome and Safari. Use a sample exported level in a separate game-compatible test harness; do not alter the live game for testing without approval.

Completion requires a working app with real generation and editing, a sample validated seven-difference export, passing compatibility tests, and a short transfer guide. Placeholder images or simulated AI success are not a completed implementation.

## 14. Remaining implementation checks

No additional product clarification is required to write this PRD. Before implementation is finalized, confirm the actual integration's model and mask support, native 2048px reliability, cost/rate limits, access-control setup, and an appropriate browser memory strategy.

The product assumptions in the decision record remain reviewable. Do not turn them into new features or silently relax the asset contract.

## 15. Sources and evidence

- **Owner source:** “Fine Line Level Maker” DOCX and the four clarification answers.
- **Game inspection, 18 September 2026:** the image-set manifest, game loader, hitmap parser/hit tester, image renderer, overlay layout, and PNG headers. Key source files in the existing project are `public/image-sets/manifest.json`, `src/hooks/useGame.ts`, `src/lib/hitmap.ts`, `src/components/GameImage.tsx`, and `src/index.css`, under `artifacts/the-fine-line/`. These paths are provenance only; the new project need not have them.
- **[S1] OpenAI image-generation guide:** https://developers.openai.com/api/docs/guides/image-generation?api-mode=image — models, dimensions, mask guidance, and editing limitations; reviewed 18 September 2026.
- **[S2] Replit AI Integrations:** https://docs.replit.com/features/integrations/replit-ai-integrations — managed access and published model list; reviewed 18 September 2026. The page states its list was last refreshed 1 August 2026; verify current access in the new project.
- **[S3] OpenAI Images API reference:** https://developers.openai.com/api/reference/resources/images.md — generation/editing resource reference.
- **[S4] Replit App Storage:** https://docs.replit.com/features/data-and-storage/object-storage
- **[S5] Replit Database:** https://docs.replit.com/features/data-and-storage/sql-database

Provider documentation is not proof of access through a particular integration or account. Model support, pricing, and API limits must be rechecked when building.