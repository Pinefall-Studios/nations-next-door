import { readFileSync } from "node:fs";
import nodePath from "node:path";
import { geoAlbersUsa, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { MapShape } from "./view";

const NUMERIC_TO_ISO: Record<string, string> = {
  "4": "AFG",
  "20": "AND",
  "204": "BEN",
  "840": "USA",
};

type Props = { name?: string; postal?: string };

function asCollection(value: unknown): FeatureCollection<Geometry, Props> {
  return value as FeatureCollection<Geometry, Props>;
}

export function usShapes(counts: Record<string, number>): MapShape[] {
  const raw = JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "../../data/us-states.geojson"), "utf8"),
  ) as unknown;
  const collection = asCollection(raw);
  const projection = geoAlbersUsa().fitSize([960, 560], collection);
  const path = geoPath(projection);
  return collection.features.flatMap((shape) => {
    const id = shape.properties?.postal;
    const name = shape.properties?.name;
    const d = path(shape);
    if (!id || !name || !d) return [];
    return [{ id, name, d, count: counts[id] ?? 0 }];
  });
}

export function worldShapes(counts: Record<string, number>): MapShape[] {
  const topology = JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "data/countries-110m.json"), "utf8"),
  ) as Topology<{ countries: GeometryCollection<Props> }>;
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as unknown as FeatureCollection<Geometry, Props>;
  const kept: Feature<Geometry, Props>[] = collection.features.filter(
    (shape) => shape.properties?.name !== "Antarctica" && shape.id !== "010",
  );
  const draw = { type: "FeatureCollection" as const, features: kept };
  const projection = geoNaturalEarth1().fitSize([960, 520], draw);
  const path = geoPath(projection);
  return kept.flatMap((shape) => {
    const numeric = String(shape.id ?? "");
    const iso = NUMERIC_TO_ISO[numeric];
    const name = shape.properties?.name ?? iso ?? "Country";
    const d = path(shape);
    if (!d) return [];
    return [{ id: iso ?? numeric, name, d, count: iso ? (counts[iso] ?? 0) : 0 }];
  });
}
