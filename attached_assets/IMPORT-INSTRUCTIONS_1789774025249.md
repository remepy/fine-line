# Importing Fine Line levels

All generated artwork and hitmaps use the approved 1024 × 1024 resolution.

For a game-layout export, copy each new folder into the game's public/image-sets/
directory. Merge manifest.entries.json into the game's existing
public/image-sets/manifest.json. If image-sets/manifest.json is included, it was
safely merged from the manifest supplied during export; back up the current
manifest before replacing it. Preview the game and verify every level before
republishing.

Descriptive exports contain _A (original), _B (modified), and _Hitmap files.
The generator does not access or publish the game project.
