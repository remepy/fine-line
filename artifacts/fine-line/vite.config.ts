import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { readFileSync } from "fs";

// The build's language, fixed at build time. The game never parses its own
// URL or takes a language from the app (spec §4.2).
const language = process.env.VITE_GAME_LANGUAGE ?? "he";
const expected = language === "en"
  ? { locale: "en-US", dir: "ltr" }
  : { locale: "he-IL", dir: "rtl" };

/**
 * Emits exactly one self-describing ./translations.json beside index.html,
 * and serves the same file in dev, so every build has its copy at the path
 * BR-12 requires. Source files live in translations/{he,en}.json.
 */
function translations(): Plugin {
  const load = () => {
    const file = path.resolve(import.meta.dirname, "translations", `${language}.json`);
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (parsed.locale !== expected.locale || parsed.dir !== expected.dir) {
      throw new Error(`Invalid language metadata in translations/${language}.json`);
    }
    return JSON.stringify(parsed, null, 2) + "\n";
  };
  return {
    name: "cyan-translations",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split("?")[0].endsWith("/translations.json")) return next();
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-cache");
        res.end(load());
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "translations.json", source: load() });
    },
  };
}

// PORT is only needed for the dev/preview server; a production build never
// starts one, so it is only enforced when a server is actually being started.
const rawPort = process.env.PORT;
const isBuild = process.argv.includes("build");

if (!isBuild && !rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = rawPort ? Number(rawPort) : 0;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// BASE_PATH controls the asset URL prefix in the built HTML. Each language
// build sets it to that language's own S3 prefix so every asset and
// ./translations.json resolve relative to the page.
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), translations()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src", "assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true, allow: [path.resolve(import.meta.dirname)] },
  },
  preview: { port, host: "0.0.0.0", allowedHosts: true },
});
