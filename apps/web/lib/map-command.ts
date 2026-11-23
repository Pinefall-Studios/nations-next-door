import { boundsForStateAndPoints } from "../../../src/core/state-geometry";
import { resolveUsState } from "../../../src/core/states";
import type { ViewGroup } from "./view";

export type MapCommand = {
  label: string;
  pgids: string[];
  bounds: [number, number, number, number] | null;
  stateCode?: string;
};

export function boundsFor(
  groups: ViewGroup[],
  stateCode?: string,
): [number, number, number, number] | null {
  const points = groups.filter(
    (group): group is ViewGroup & { latitude: number; longitude: number } =>
      group.latitude !== null && group.longitude !== null,
  );
  return boundsForStateAndPoints(stateCode, points);
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
    stateCode,
  };
}
