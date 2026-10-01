import { spawnSync } from "node:child_process";
import path from "node:path";
import { GAME_ID, LANGUAGES } from "./game.mjs";

const root = path.resolve(import.meta.dirname, "..");

// One build per language, each with its own S3 base path so every asset and
// ./translations.json resolve relative to that page (spec §4.1). The
// translations file itself is emitted by the cyan-translations vite plugin.
for (const { lang } of LANGUAGES) {
  const output = path.join(root, "dist", "fine-line", lang);
  const result = spawnSync("pnpm", [
    "exec", "vite", "build", "--config", "vite.config.ts", "--outDir", output,
  ], {
    cwd: root,
    env: { ...process.env, VITE_GAME_LANGUAGE: lang },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Built ${lang}: ${output}`);
}
