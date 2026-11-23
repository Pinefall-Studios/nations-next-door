import { readFileSync } from "node:fs";
import nodePath from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const raw = readFileSync(nodePath.join(process.cwd(), "../../data/us-states.geojson"), "utf8");
  return new Response(raw, { headers: { "content-type": "application/json; charset=utf-8" } });
}
