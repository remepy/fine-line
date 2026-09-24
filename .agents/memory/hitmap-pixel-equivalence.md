---
name: Hitmap pixel equivalence
description: How to prove a change to The Fine Line's hitmap parsing or level artwork did not alter gameplay, and the one image set whose dimensions do not match.
---

Any change to hitmap parsing or to how level artwork is encoded must be proven
pixel-equivalent before it is called done. "It still renders and shows 7
differences" is not proof — a parsing regression usually changes zone *shapes*
or *ids*, not the count.

**Why:** The zone count, zone ids, and the per-pixel zone lookup are the whole
game. A subtly different flood fill or a lossy hitmap re-encode silently
changes which taps register, and there is no visible symptom until a player
cannot find a difference the game insists is there.

**How to apply:**

- ImageMagick is available; there is no canvas or PIL in the container. Dump
  raw pixels with `magick <file> -depth 8 RGBA:-` into a `Uint8ClampedArray`
  and run the parser on it in Node (`node --experimental-strip-types` imports
  the TypeScript core directly). This is why the parsing core is kept free of
  DOM dependencies — it is the only way to test it headlessly.
- For a parser change: keep a verbatim copy of the previous algorithm, run both
  over every hitmap, and require the zone array and the full per-pixel zone
  lookup to be identical, not merely the same length.
- For an artwork re-encode: lossy compression can erase a difference rather
  than the mask. Measure the mean original-vs-modified pixel delta *inside each
  zone* before and after re-encoding and require it to stay ~100%. A zone whose
  delta collapses is a difference the player can no longer see.

**Asset quirk:** one image set ships a `modified` image at half the resolution
of its `original` and `hitmap`. Gameplay is unaffected because hit testing is
done in relative (0-1) coordinates, but any tool that indexes both images by
hitmap pixel index will read out of bounds and produce `NaN`. Resample to the
hitmap grid before comparing, and do not assume the three files in a set share
dimensions.
