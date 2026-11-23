import type { ViewGroup } from "./view";

export type MapCommand = {
  label: string;
  pgids: string[];
  bounds: [number, number, number, number] | null;
};

export function boundsFor(groups: ViewGroup[]): [number, number, number, number] | null {
  const points = groups.filter(
    (group): group is ViewGroup & { latitude: number; longitude: number } =>
      group.latitude !== null && group.longitude !== null,
  );
  if (points.length === 0) return null;
  const lngs = points.map((group) => group.longitude);
  const lats = points.map((group) => group.latitude);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const padLng = Math.max((east - west) * 0.2, 1.4);
  const padLat = Math.max((north - south) * 0.2, 1.4);
  return [west - padLng, south - padLat, east + padLng, north + padLat];
}

export function commandFor(label: string, groups: ViewGroup[]): MapCommand {
  return {
    label: `Showing ${label}`,
    pgids: groups.map((group) => group.pgid),
    bounds: boundsFor(groups),
  };
}
