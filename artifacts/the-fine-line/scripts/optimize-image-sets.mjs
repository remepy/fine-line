#!/usr/bin/env node
/**
 * Generates the web-ready image sets that the game actually downloads.
 *
 *   asset-sources/image-sets/<id>/original.png   (master, never shipped)
 *   asset-sources/image-sets/<id>/modified.png   (master, never shipped)
 *                       │
 *                       ▼  lossy WebP, visually transparent
 *   public/image-sets/<id>/original.webp
 *   public/image-sets/<id>/modified.webp
 *
 * hitmap.png is NOT touched. It lives directly in public/image-sets/<id>/ and
 * must stay a lossless PNG: src/lib/hitmap.ts reads its raw pixels and any
 * lossy re-encode could change the white-pixel mask and therefore the zone
 * count.
 *
 * Usage:
 *   node scripts/optimize-image-sets.mjs          # only (re)build stale files
 *   node scripts/optimize-image-sets.mjs --force  # rebuild everything
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "asset-sources", "image-sets");
const PUBLIC_DIR = path.join(ROOT, "public", "image-sets");

// Spot-the-difference gameplay depends on small details staying legible, so we
// trade a little file size for a high quality factor (~43 dB PSNR).
const QUALITY = "92";
const CONVERTED = ["original", "modified"];

const force = process.argv.includes("--force");

async function statOrNull(p) {
  try {
    return await stat(p);
  } catch {
    return null;
  }
}

async function convert(src, dest) {
  await run("magick", [
    src,
    "-quality",
    QUALITY,
    "-define",
    "webp:method=6",
    dest,
  ]);
}

async function main() {
  const sourceDirs = (await readdir(SOURCE_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  let built = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const id of sourceDirs) {
    await mkdir(path.join(PUBLIC_DIR, id), { recursive: true });

    for (const name of CONVERTED) {
      const src = path.join(SOURCE_DIR, id, `${name}.png`);
      const dest = path.join(PUBLIC_DIR, id, `${name}.webp`);

      const srcStat = await statOrNull(src);
      if (!srcStat) {
        console.warn(`! missing master: ${path.relative(ROOT, src)}`);
        continue;
      }

      const destStat = await statOrNull(dest);
      if (!force && destStat && destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }

      await convert(src, dest);
      const out = await stat(dest);
      savedBytes += srcStat.size - out.size;
      built++;
      console.log(
        `✓ ${id}/${name}.webp  ${(srcStat.size / 1e6).toFixed(1)}MB → ${(
          out.size / 1e6
        ).toFixed(2)}MB`,
      );
    }
  }

  console.log(
    `\n${built} built, ${skipped} up to date, ${(savedBytes / 1e6).toFixed(
      1,
    )}MB saved.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
