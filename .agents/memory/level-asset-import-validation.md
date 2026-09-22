---
name: Level asset import validation (The Fine Line)
description: How to validate uploaded spot-the-difference level packs before adding them to the game, and the traps that make validation silently pass or fail.
---

Validate every uploaded level pack against the game's own parsing rules before adding it to the manifest; never repair or re-encode supplied artwork or hitmaps.

**Why:** the hitmap is interpreted pixel-exactly (near-white pixels, 8-neighbour connected components, tiny components dropped). A pack that looks fine can yield the wrong number of playable zones, or zones a player can see but not click. Lossy re-encoding of a hitmap can change the zone count outright.

**How to apply:**
- No image library is installed (no Pillow / sharp / pngjs). Decode PNGs with a stdlib zlib + un-filter routine; uploads have appeared as both RGB (colour type 2) and RGBA (type 6), so handle both.
- Check: shared dimensions across the three images, hitmap is effectively binary, component count matches the level's advertised difference count, every component contains real pixel change between original and modified.
- Changed pixels *outside* the mask are normal when they sit within a pixel or two of a zone edge (shadow/edge spill). Measure the distance to the nearest zone before treating them as an unmarked difference — a far-away cluster is a real defect worth reporting to the user.
- Then re-verify with the game's actual parser: transpile the hitmap module and mock `Image` plus a canvas context. `getImageData` must return an object shaped `{data, width, height}` — returning the raw array alone makes the parser report zero zones and the validation looks like a bad asset.
- Upload archives use varying internal file names (e.g. a modified image named `last-modification.png`) and may omit a manifest; map them onto the game's canonical `original/modified/hitmap` names on copy.
