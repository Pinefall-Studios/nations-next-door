import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerSrc = path.join(here, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const publicDir = path.join(here, "public");
const workerDest = path.join(publicDir, "maplibre-gl-worker.mjs");
if (existsSync(workerSrc)) {
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(workerSrc, workerDest);
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(here, "../.."),
  outputFileTracingIncludes: {
    "/api/**": [
      "../../src/core/data/**/*",
      "../../data/**/*",
      "./data/**/*",
    ],
    "/*": [
      "../../src/core/data/**/*",
      "../../data/**/*",
      "./data/**/*",
    ],
  },
  serverExternalPackages: ["maplibre-gl"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
    };
    config.resolve.extensions = Array.from(
      new Set([...(config.resolve.extensions ?? []), ".geojson"]),
    );
    config.module.rules.push({
      test: /\.geojson$/,
      type: "json",
    });
    return config;
  },
};

export default nextConfig;
