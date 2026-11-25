import { stateForPoint } from "../../../../../src/core/state-geometry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ state: null }, { status: 400 });
  }
  const state = stateForPoint(lat, lng);
  return Response.json({ state });
}
