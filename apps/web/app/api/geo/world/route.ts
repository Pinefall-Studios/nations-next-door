import { readFileSync } from "node:fs";
import nodePath from "node:path";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

export const runtime = "nodejs";

export async function GET() {
  const topology = JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "data/countries-110m.json"), "utf8"),
  ) as Topology<{ countries: GeometryCollection<{ name?: string }> }>;
  const collection = feature(topology, topology.objects.countries) as unknown as FeatureCollection<
    Geometry,
    { name?: string }
  >;
  const features = collection.features.filter(
    (shape) => shape.properties?.name !== "Antarctica" && shape.id !== "010",
  );
  return Response.json({ type: "FeatureCollection", features });
}
