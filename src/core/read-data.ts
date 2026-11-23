import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Read a JSON file next to a module, with cwd fallbacks for bundled Next.js. */
export function readNearbyFile(moduleUrl: string, relativeFromModule: string, fromCwd: string[]): string {
  const tried: string[] = [];
  try {
    const resolved = fileURLToPath(new URL(relativeFromModule, moduleUrl));
    tried.push(resolved);
    if (existsSync(resolved)) return readFileSync(resolved, "utf8");
  } catch {
    // Webpack may rewrite import.meta.url to a non-file URL.
  }
  for (const relative of fromCwd) {
    const resolved = path.resolve(process.cwd(), relative);
    tried.push(resolved);
    if (existsSync(resolved)) return readFileSync(resolved, "utf8");
  }
  throw new Error(`Could not read ${relativeFromModule}. Tried ${tried.join(", ")}`);
}
