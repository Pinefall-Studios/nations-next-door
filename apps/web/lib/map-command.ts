import { bboxForState } from "../../../src/core/state-geometry";
import { resolveUsState } from "../../../src/core/states";
import type { ViewGroup } from "./view";

export type MapCommand = {
  label: string;
  pgids: string[];
  bounds: [number, number, number, number] | null;
};

function padBounds(bounds: [number, number, number, number]): [number, number, number, number] {
  const [west, south, east, north] = bounds;
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
    if (stateBox) boxes.push(stateBox);
  }
  if (points.length > 0) {
    boxes.push([
      Math.min(...points.map((group) => group.longitude)),
      Math.min(...points.map((group) => group.latitude)),
      Math.max(...points.map((group) => group.longitude)),
      Math.max(...points.map((group) => group.latitude)),
    ]);
  }
  if (boxes.length === 0) return null;
  const west = Math.min(...boxes.map((box) => box[0]));
  const south = Math.min(...boxes.map((box) => box[1]));
  const east = Math.max(...boxes.map((box) => box[2]));
  const north = Math.max(...boxes.map((box) => box[3]));
  return padBounds([west, south, east, north]);
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
