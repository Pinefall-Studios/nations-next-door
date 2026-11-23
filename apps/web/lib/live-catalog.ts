import { imbAttribution } from "../../../src/core/attribution";
import { getCatalog } from "./catalog";
import { fromPublic } from "./from-public";
import { peopleGroups } from "./service";
import type { Catalog, ViewGroup } from "./view";

function asCatalog(groups: ViewGroup[], attribution: string, live: boolean): Catalog {
  return {
    mode: live ? "live" : "sample",
    sampleLabel: live ? null : "Sample data",
    attribution,
    groups: [...groups].sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("catalog timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function loadCountryCatalog(country = "USA", timeoutMs?: number): Promise<Catalog> {
  try {
    const request = peopleGroups().loadCountry(country);
    const loaded = timeoutMs ? await withTimeout(request, timeoutMs) : await request;
    return asCatalog(loaded.groups.map(fromPublic), imbAttribution(new Date(loaded.fetchedAt)), true);
  } catch {
    return getCatalog();
  }
}

export async function loadGroupPage(pgid: string): Promise<{ group: ViewGroup; catalog: Catalog } | null> {
  try {
    const result = await peopleGroups().getPeopleGroup({ pgid });
    const group = fromPublic(result.group);
    return { group, catalog: asCatalog([group], result.attribution, true) };
  } catch {
    const catalog = getCatalog();
    const sample = catalog.groups.find((group) => group.pgid === pgid);
    if (!sample) return null;
    return { group: sample, catalog };
  }
}
