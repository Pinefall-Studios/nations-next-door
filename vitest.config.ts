import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "geojson-as-json",
      enforce: "pre",
      load(id) {
        if (!id.endsWith(".geojson")) return;
        return `export default ${readFileSync(id, "utf8")}`;
      },
    },
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});

