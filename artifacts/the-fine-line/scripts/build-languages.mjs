import { spawnSync } from "node:child_process";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const languages = [
  { lang: "he", translation: "public/translations.json" },
  { lang: "en", translation: "translations/en.json" },
];

for (const { lang, translation } of languages) {
  const base = `/games/the-fine-line/${lang}/`;
  const output = path.join(root, "dist", "languages", lang);
  const result = spawnSync("pnpm", [
    "exec", "vite", "build", "--config", "vite.config.ts", "--outDir", output,
  ], {
    cwd: root,
    env: { ...process.env, BASE_PATH: base },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  const strings = JSON.parse(await readFile(path.join(root, translation), "utf8"));
  if (strings.locale !== (lang === "he" ? "he-IL" : "en-US") ||
      strings.dir !== (lang === "he" ? "rtl" : "ltr")) {
    throw new Error(`Invalid language metadata for ${lang}`);
  }
  await copyFile(path.join(root, translation), path.join(output, "translations.json"));
  const manifestFile = path.join(output, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.name = strings.keys.title;
  manifest.short_name = strings.keys.title;
  manifest.description = strings.keys.appDescription;
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Built ${lang}: ${output} → ${base}`);
}