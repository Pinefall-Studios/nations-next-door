import { readFileSync } from "node:fs";
import nodePath from "node:path";
import { geoAlbersUsa, geoMercator, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { MapShape } from "./view";

const NUMERIC_TO_ISO: Record<string, string> = {
  "4": "AFG",
  "20": "AND",
  "204": "BEN",
  "320": "GTM",
  "840": "USA",
};

function isoFor(shapeId: string | number | undefined): string | undefined {
  const raw = String(shapeId ?? "");
  const parsed = Number.parseInt(raw, 10);
  return NUMERIC_TO_ISO[raw] ?? (Number.isNaN(parsed) ? undefined : NUMERIC_TO_ISO[String(parsed)]);
}

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
    const iso = isoFor(shape.id);
    const name = shape.properties?.name ?? iso ?? "Country";
    const d = path(shape);
    if (!d) return [];
    return [{ id: iso ?? numeric, name, d, count: iso ? (counts[iso] ?? 0) : 0 }];
  });
}

export type LocatorShape = { d: string; emphasis: boolean };
export type Locator = { shapes: LocatorShape[]; marker: { x: number; y: number } | null };

function frameAround(longitude: number, latitude: number, pad: number) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [[
        [longitude - pad, latitude - pad],
        [longitude + pad, latitude - pad],
        [longitude + pad, latitude + pad],
        [longitude - pad, latitude + pad],
        [longitude - pad, latitude - pad],
      ]],
    },
  };
}

function loadUs(): FeatureCollection<Geometry, Props> {
  return asCollection(JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "../../data/us-states.geojson"), "utf8"),
  ));
}

function loadWorld(): Feature<Geometry, Props>[] {
  const topology = JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "data/countries-110m.json"), "utf8"),
  ) as Topology<{ countries: GeometryCollection<Props> }>;
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as unknown as FeatureCollection<Geometry, Props>;
  return collection.features.filter(
    (shape) => shape.properties?.name !== "Antarctica" && shape.id !== "010",
  );
}

/** Small regional map. Coordinates must already be rounded when the country requires it. */
export function buildLocator(input: {
  latitude: number;
  longitude: number;
  countryCode: string | null;
  usStates: string[];
}): Locator {
  const pad = input.countryCode === "USA" ? 9 : 16;
  const projection = geoMercator().fitSize([640, 360], frameAround(input.longitude, input.latitude, pad));
  const path = geoPath(projection);
  const shapes: LocatorShape[] = [];
  if (input.countryCode === "USA") {
    for (const shape of loadUs().features) {
      const d = path(shape);
      const postal = shape.properties?.postal;
      if (!d || !postal) continue;
      shapes.push({ d, emphasis: input.usStates.includes(postal) });
    }
  } else {
    for (const shape of loadWorld()) {
      const d = path(shape);
      const iso = isoFor(shape.id);
      if (!d) continue;
      shapes.push({ d, emphasis: iso === input.countryCode });
    }
  }
  const point = projection([input.longitude, input.latitude]);
  return {
    shapes,
    marker: point ? { x: point[0], y: point[1] } : null,
  };
}
