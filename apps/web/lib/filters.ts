import { evangelicalBandDepth, unreachedFromBand } from "../../../src/core/project";
import type { ViewGroup } from "./view";

export type Filters = {
  unreachedOnly: boolean;
  language: string;
  religion: string;
  scripture: boolean;
  place: string;
  band: string;
  popMin: string;
  popMax: string;
};

export const EMPTY_FILTERS: Filters = {
  unreachedOnly: true,
  language: "",
  religion: "",
  scripture: false,
  place: "",
  band: "",
  popMin: "",
  popMax: "",
};

/** Deepest evangelical band first, then population descending. */
export function sortListed(groups: ViewGroup[]): ViewGroup[] {
  return [...groups].sort((a, b) => {
    const deep = evangelicalBandDepth(b.evangelicalBand) - evangelicalBandDepth(a.evangelicalBand);
    if (deep !== 0) return deep;
    return (b.population ?? 0) - (a.population ?? 0);
  });
}

export function applyFilters(groups: ViewGroup[], filters: Filters): ViewGroup[] {
  const kept = groups.filter((group) => {
    if (filters.unreachedOnly && unreachedFromBand(group.evangelicalBand) !== true) return false;
    if (filters.language && group.languageCode !== filters.language && group.languageName !== filters.language) return false;
    if (filters.religion && group.religion !== filters.religion) return false;
    if (filters.scripture && group.bible !== "Available") return false;
    if (filters.place) {
      const place = filters.place.toUpperCase();
      const inState = group.usStates.includes(place);
      const inCountry = (group.countryCode ?? "").toUpperCase() === place || (group.country ?? "").toLowerCase() === filters.place.toLowerCase();
      if (!inState && !inCountry) return false;
    }
    if (filters.band && group.evangelicalBand !== filters.band) return false;
    const min = Number(filters.popMin);
    const max = Number(filters.popMax);
    if (filters.popMin && Number.isFinite(min) && (group.population ?? 0) < min) return false;
    if (filters.popMax && Number.isFinite(max) && (group.population ?? 0) > max) return false;
    return true;
  });
  return sortListed(kept);
}
