import { bboxForState } from "../../../src/core/state-geometry";
import { resolveUsState } from "../../../src/core/states";
import type { ViewGroup } from "./view";

export type MapCommand = {
  label: string;
  pgids: string[];
  bounds: [number, number, number, number] | null;
};

/** [west, south, east, north]. Swaps lat/lng when the second pair is not a latitude. */
export function lngLatBounds(
  west: number,
  south: number,
  east: number,
  north: number,
): [number, number, number, number] {
  if ((south < -90 || north > 90 || south > 90 || north < -90) && Math.abs(west) <= 90 && Math.abs(east) <= 90) {
    [west, south, east, north] = [south, west, north, east];
  }
  return [
    Math.min(west, east),
    Math.min(south, north),
    Math.max(west, east),
    Math.max(south, north),
  ];
}

function padBounds(bounds: [number, number, number, number]): [number, number, number, number] {
  const [west, south, east, north] = lngLatBounds(...bounds);
  const padLng = Math.max((east - west) * 0.15, 0.4);
  const padLat = Math.max((north - south) * 0.15, 0.4);
  return [west - padLng, south - padLat, east + padLng, north + padLat];
}

export function boundsFor(
  groups: ViewGroup[],
  stateCode?: string,
): [number, number, number, number] | null {
  const points = groups.filter(
    (group): group is ViewGroup & { latitude: number; longitude: number } =>
      group.latitude !== null && group.longitude !== null,
  );
  const boxes: Array<[number, number, number, number]> = [];
  if (stateCode) {
    const stateBox = bboxForState(stateCode);
    if (stateBox) boxes.push(lngLatBounds(...stateBox));
  }
  if (points.length > 0) {
    boxes.push(
      lngLatBounds(
        Math.min(...points.map((group) => group.longitude)),
        Math.min(...points.map((group) => group.latitude)),
        Math.max(...points.map((group) => group.longitude)),
        Math.max(...points.map((group) => group.latitude)),
      ),
    );
  }
  if (boxes.length === 0) return null;
  const west = Math.min(...boxes.map((box) => box[0]));
  const south = Math.min(...boxes.map((box) => box[1]));
  const east = Math.max(...boxes.map((box) => box[2]));
  const north = Math.max(...boxes.map((box) => box[3]));
  return padBounds(lngLatBounds(west, south, east, north));
}

export function commandFor(label: string, groups: ViewGroup[]): MapCommand {
  let stateCode: string | undefined;
  try {
    stateCode = resolveUsState(label).code;
  } catch {
    stateCode = undefined;
  }
  return {
    label: `Showing ${label}`,
    pgids: groups.map((group) => group.pgid),
    bounds: boundsFor(groups, stateCode),
  };
}
