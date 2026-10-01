import { spawnSync } from "node:child_process";
import path from "node:path";
import { GAME_ID, LANGUAGES } from "./game.mjs";

const root = path.resolve(import.meta.dirname, "..");

/**
 * Where the game sits under the CDN origin. The deployed layout is not always
 * the bare /games/<gameId>/ of the spec — set DEPLOY_PREFIX to match whatever
 * the bucket actually uses, e.g.
 *
 *   DEPLOY_PREFIX=/assets/cyan/games pnpm run build:languages
 *
 * It must be an absolute path. A relative base would break the hitmap worker,
 * which resolves relative URLs against its own script location rather than
 * the page.
 */
const deployPrefix = (process.env.DEPLOY_PREFIX ?? "/games").replace(/\/+$/, "");
if (!deployPrefix.startsWith("/")) {
  throw new Error(`DEPLOY_PREFIX must be an absolute path, got "${deployPrefix}"`);
}

// One build per language, each with its own S3 base path so every asset and
// ./translations.json resolve relative to that page (spec §4.1). The
// translations file itself is emitted by the cyan-translations vite plugin.
for (const { lang } of LANGUAGES) {
  const base = `${deployPrefix}/${GAME_ID}/${lang}/`;
  const output = path.join(root, "dist", "languages", lang);
  const result = spawnSync("pnpm", [
    "exec", "vite", "build", "--config", "vite.config.ts", "--outDir", output,
  ], {
    cwd: root,
    env: { ...process.env, BASE_PATH: base, VITE_GAME_LANGUAGE: lang },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Built ${lang}: ${output} → ${base}`);
}
