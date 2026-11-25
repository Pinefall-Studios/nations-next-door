import { loadUsStates } from "../../../../lib/maps";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(loadUsStates());
}
