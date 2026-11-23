import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import topology from "../../../../data/countries-110m.json" with { type: "json" };

export const runtime = "nodejs";

export async function GET() {
  const topo = topology as unknown as Topology<{ countries: GeometryCollection<{ name?: string }> }>;
  const collection = feature(
    topo,
    topo.objects.countries,
  ) as unknown as FeatureCollection<Geometry, { name?: string }>;
  const features = collection.features.filter(
    (shape) => shape.properties?.name !== "Antarctica" && shape.id !== "010",
  );
  return Response.json({ type: "FeatureCollection", features });
}
