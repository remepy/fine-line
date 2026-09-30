import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// PORT is only needed for the dev/preview server. During a production build
// (e.g. on the Replit deployment builder) it is intentionally not set, so we
// only enforce it when a server is actually being started.
const rawPort = process.env.PORT;
const isBuild = process.argv.includes("build");

if (!isBuild && !rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = rawPort ? Number(rawPort) : 0;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// BASE_PATH controls the asset URL prefix in the built HTML. The dev workflow
// always sets it; for production builds we fall back to "/" since this app is
// served at the domain root.
const basePath = "./"

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
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
    fs: {
      strict: true,
      allow: [
        path.resolve(import.meta.dirname),
        path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      ],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
