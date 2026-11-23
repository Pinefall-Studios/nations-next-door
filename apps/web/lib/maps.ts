import { readFileSync } from "node:fs";
import nodePath from "node:path";
import { geoAlbers, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
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
type Shape = Feature<Geometry, Props>;

function asCollection(value: unknown): FeatureCollection<Geometry, Props> {
  return value as FeatureCollection<Geometry, Props>;
}

export type DrawnMap = { shapes: MapShape[]; viewBox: string };

function sizeFor(
  feature: Feature | FeatureCollection,
  width: number,
  project: () => GeoProjection,
): { width: number; height: number } {
  const probe = project().scale(1).translate([0, 0]);
  const bounds = geoPath(probe).bounds(feature);
  const spanX = Math.max(bounds[1][0] - bounds[0][0], 0.01);
  const spanY = Math.max(bounds[1][1] - bounds[0][1], 0.01);
  const height = Math.round(Math.min(640, Math.max(340, width * (spanY / spanX))));
  return { width, height };
}

function geometryBounds(geometry: Geometry): [number, number, number, number] | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let seen = false;
  const walk = (node: Position | Position[] | Position[][] | Position[][][]): void => {
    if (typeof (node as Position)[0] === "number") {
      const [x, y] = node as Position;
      seen = true;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      return;
    }
    for (const child of node as Position[]) walk(child as Position);
  };
  if (!("coordinates" in geometry)) return null;
  walk(geometry.coordinates as Position[]);
  return seen ? [minX, minY, maxX, maxY] : null;
}

function intersects(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function expand(
  bounds: [number, number, number, number],
  pad: number,
): [number, number, number, number] {
  return [bounds[0] - pad, bounds[1] - pad, bounds[2] + pad, bounds[3] + pad];
}

function union(bounds: Array<[number, number, number, number] | null>): [number, number, number, number] | null {
  const present = bounds.filter((item): item is [number, number, number, number] => item !== null);
  if (present.length === 0) return null;
  return [
    Math.min(...present.map((item) => item[0])),
    Math.min(...present.map((item) => item[1])),
    Math.max(...present.map((item) => item[2])),
    Math.max(...present.map((item) => item[3])),
  ];
}

function loadUs(): FeatureCollection<Geometry, Props> {
  return asCollection(JSON.parse(
    readFileSync(nodePath.join(process.cwd(), "../../data/us-states.geojson"), "utf8"),
  ));
}

function loadWorld(): Shape[] {
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

function lower48(collection: FeatureCollection<Geometry, Props>): Shape[] {
  return collection.features.filter((shape) => {
    const postal = shape.properties?.postal;
    return postal && postal !== "AK" && postal !== "HI";
  });
}

export function usShapes(counts: Record<string, number>): DrawnMap {
  const features = lower48(loadUs());
  const collection = { type: "FeatureCollection" as const, features };
  const { width, height } = sizeFor(collection, 960, geoAlbers);
  const projection = geoAlbers().fitExtent([[12, 12], [width - 12, height - 12]], collection);
  const path = geoPath(projection);
  const shapes = features.flatMap((shape) => {
    const id = shape.properties?.postal;
    const name = shape.properties?.name;
    const d = path(shape);
    if (!id || !name || !d) return [];
    return [{ id, name, d, count: counts[id] ?? 0 }];
  });
  return { shapes, viewBox: `0 0 ${width} ${height}` };
}

export function worldShapes(counts: Record<string, number>): DrawnMap {
  const kept = loadWorld();
  const collection = { type: "FeatureCollection" as const, features: kept };
  const { width, height } = sizeFor(collection, 960, geoNaturalEarth1);
  const projection = geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], collection);
  const path = geoPath(projection);
  const shapes = kept.flatMap((shape) => {
    const numeric = String(shape.id ?? "");
    const iso = isoFor(shape.id);
    const name = shape.properties?.name ?? iso ?? "Country";
    const d = path(shape);
    if (!d) return [];
    return [{ id: iso ?? numeric, name, d, count: iso ? (counts[iso] ?? 0) : 0 }];
  });
  return { shapes, viewBox: `0 0 ${width} ${height}` };
}

export type LocatorShape = { d: string; emphasis: boolean };
export type Locator = {
  shapes: LocatorShape[];
  marker: { x: number; y: number } | null;
  width: number;
  height: number;
};

/** Regional map. Coordinates must already be rounded when the country requires it. */
export function buildLocator(input: {
  latitude: number;
  longitude: number;
  countryCode: string | null;
  usStates: string[];
}): Locator {
  if (input.countryCode === "USA") return locatorUs(input);
  return locatorWorld(input);
}

function locatorUs(input: { latitude: number; longitude: number; usStates: string[] }): Locator {
  const states = lower48(loadUs());
  const named = states.filter((shape) => input.usStates.includes(shape.properties?.postal ?? ""));
  const hit = states.filter((shape) => {
    const bounds = geometryBounds(shape.geometry);
    return bounds
      && input.longitude >= bounds[0]
      && input.longitude <= bounds[2]
      && input.latitude >= bounds[1]
      && input.latitude <= bounds[3];
  });
  const primary = named.length > 0 ? named : hit;
  const focus = primary.length > 0 ? primary : nearestState(states, input.longitude, input.latitude);
  const focusBounds = union(focus.map((shape) => geometryBounds(shape.geometry)));
  const window = focusBounds ? expand(focusBounds, 2.2) : expand([input.longitude, input.latitude, input.longitude, input.latitude], 6);
  const visible = states.filter((shape) => {
    const bounds = geometryBounds(shape.geometry);
    return bounds ? intersects(bounds, window) : false;
  });
  const collection = { type: "FeatureCollection" as const, features: focus };
  const { width, height } = sizeFor(collection, 640, geoAlbers);
  const projection = geoAlbers().fitExtent([[36, 28], [width - 36, height - 28]], collection);
  const path = geoPath(projection);
  const shapes = visible.flatMap((shape) => {
    const d = path(shape);
    const postal = shape.properties?.postal;
    if (!d || !postal) return [];
    return [{ d, emphasis: focus.some((item) => item.properties?.postal === postal) }];
  });
  const point = projection([input.longitude, input.latitude]);
  return { shapes, marker: point ? { x: point[0], y: point[1] } : null, width, height };
}

function nearestState(states: Shape[], longitude: number, latitude: number): Shape[] {
  let best = states[0];
  let bestDistance = Infinity;
  for (const shape of states) {
    const bounds = geometryBounds(shape.geometry);
    if (!bounds) continue;
    const dx = longitude - (bounds[0] + bounds[2]) / 2;
    const dy = latitude - (bounds[1] + bounds[3]) / 2;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = shape;
      bestDistance = distance;
    }
  }
  return best ? [best] : [];
}

function locatorWorld(input: { latitude: number; longitude: number; countryCode: string | null }): Locator {
  const countries = loadWorld();
  const focus = countries.find((shape) => isoFor(shape.id) === input.countryCode);
  if (!focus) return locatorPoint(countries, input.longitude, input.latitude);
  const focusBounds = geometryBounds(focus.geometry);
  const window = focusBounds ? expand(focusBounds, 4) : null;
  const visible = window
    ? countries.filter((shape) => {
      const bounds = geometryBounds(shape.geometry);
      return bounds ? intersects(bounds, window) : false;
    })
    : [focus];
  const { width, height } = sizeFor(focus, 640, geoMercator);
  const projection = geoMercator().fitExtent([[32, 24], [width - 32, height - 24]], focus);
  const path = geoPath(projection);
  const shapes = visible.flatMap((shape) => {
    const d = path(shape);
    if (!d) return [];
    return [{ d, emphasis: shape === focus }];
  });
  const point = projection([input.longitude, input.latitude]);
  return { shapes, marker: point ? { x: point[0], y: point[1] } : null, width, height };
}

function locatorPoint(countries: Shape[], longitude: number, latitude: number): Locator {
  const width = 640;
  const height = 420;
  const pad = 3.5;
  const scale = (width * 0.62) / (2 * pad * Math.PI / 180);
  const projection = geoMercator().center([longitude, latitude]).scale(scale).translate([width / 2, height / 2]);
  const path = geoPath(projection);
  const window: [number, number, number, number] = [longitude - pad, latitude - pad, longitude + pad, latitude + pad];
  const shapes = countries.flatMap((shape) => {
    const bounds = geometryBounds(shape.geometry);
    if (!bounds || !intersects(bounds, window)) return [];
    const d = path(shape);
    if (!d) return [];
    return [{ d, emphasis: false }];
  });
  const point = projection([longitude, latitude]);
  return { shapes, marker: point ? { x: point[0], y: point[1] } : null, width, height };
}
