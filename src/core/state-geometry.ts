import usStates from "../../data/us-states.geojson" with { type: "json" };

interface PreparedState {
  code: string;
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
  polygons: number[][][][];
}

let prepared: PreparedState[] | undefined;

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function walkPositions(coords: unknown, visit: (lng: number, lat: number) => void): void {
  if (!Array.isArray(coords) || coords.length === 0) return;
  if (isPosition(coords)) {
    visit(coords[0], coords[1]);
    return;
  }
  for (const child of coords) walkPositions(child, visit);
}

function asPolygons(type: string, coordinates: unknown): number[][][][] {
  if (type === "Polygon" && Array.isArray(coordinates)) {
    return [coordinates as number[][][]];
  }
  if (type === "MultiPolygon" && Array.isArray(coordinates)) {
    return coordinates as number[][][][];
  }
  return [];
}

function loadStates(): PreparedState[] {
  if (prepared) return prepared;
  const collection = usStates as {
    features?: Array<{
      properties?: { postal?: string };
      geometry?: { type?: string; coordinates?: unknown };
    }>;
  };
  prepared = (collection.features ?? []).flatMap((feature) => {
    const code = feature.properties?.postal;
    const geometry = feature.geometry;
    if (!code || !geometry?.type || geometry.coordinates === undefined) return [];
    const polygons = asPolygons(geometry.type, geometry.coordinates);
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    walkPositions(polygons, (lng, lat) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
    if (!Number.isFinite(minLng)) return [];
    return [{ code, bbox: [minLng, minLat, maxLng, maxLat], polygons }];
  });
  return prepared;
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[index];
    const end = ring[previous];
    if (!start || !end) continue;
    const startLng = start[0];
    const startLat = start[1];
    const endLng = end[0];
    const endLat = end[1];
    if (
      startLng === undefined ||
      startLat === undefined ||
      endLng === undefined ||
      endLat === undefined
    ) {
      continue;
    }
    const crosses = startLat > lat !== endLat > lat;
    if (!crosses) continue;
    const intersectLng =
      ((endLng - startLng) * (lat - startLat)) / (endLat - startLat) + startLng;
    if (lng < intersectLng) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, polygon: number[][][]): boolean {
  const outer = polygon[0];
  if (!outer || !pointInRing(lng, lat, outer)) return false;
  for (let index = 1; index < polygon.length; index += 1) {
    const hole = polygon[index];
    if (hole && pointInRing(lng, lat, hole)) return false;
  }
  return true;
}

/** Bounding box [west, south, east, north] of a state, or null when unknown. */
export function bboxForState(code: string): [number, number, number, number] | null {
  const state = loadStates().find((item) => item.code === code);
  if (!state) return null;
  const [minLng, minLat, maxLng, maxLat] = state.bbox;
  return [minLng, minLat, maxLng, maxLat];
}

/** Postal code of the state that contains this point, or null when none does. */
export function stateForPoint(latitude: number, longitude: number): string | null {
  for (const state of loadStates()) {
    const [minLng, minLat, maxLng, maxLat] = state.bbox;
    if (longitude < minLng || longitude > maxLng || latitude < minLat || latitude > maxLat) {
      continue;
    }
    for (const polygon of state.polygons) {
      if (pointInPolygon(longitude, latitude, polygon)) return state.code;
    }
  }
  return null;
}
