import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveCountry } from "../src/core/places.js";
import { stateForPoint } from "../src/core/state-geometry.js";

const root = fileURLToPath(new URL("..", import.meta.url));

function typescriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) files.push(...typescriptFiles(full));
    else if (full.endsWith(".ts") && !full.endsWith(".d.ts")) files.push(full);
  }
  return files;
}

describe("bundled geographic data", () => {
  it("does not read data files from relative filesystem paths at runtime", () => {
    const files = [
      ...typescriptFiles(path.join(root, "src/core")),
      ...typescriptFiles(path.join(root, "apps/web/app/api")),
      ...typescriptFiles(path.join(root, "apps/web/lib")),
    ];
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\breadNearbyFile\b/);
      expect(source, file).not.toMatch(/\breadFileSync\s*\(/);
      expect(source, file).not.toMatch(/\bexistsSync\s*\(/);
    }
  });

  it("resolves countries and US states from statically imported JSON", () => {
    expect(resolveCountry("USA")).toBe("USA");
    expect(resolveCountry("Benin")).toBe("BEN");
    expect(stateForPoint(29.76, -95.36)).toBe("TX");
  });
});
