import { isRestrictedAccessCountry, roundTo1Decimal } from "../../../src/core/restricted";
import { SAMPLE_SEEDS, type SampleSeed } from "./sample";
import type { Catalog, ResourceLink, ViewGroup } from "./view";

const ATTRIBUTION =
  "This information was provided by The International Mission Board - Global Research, November 2026, Nations Next Door, www.peoplegroups.org";

function linksFor(seed: SampleSeed): ResourceLink[] {
  const links: ResourceLink[] = [
    {
      label: "unfoldingWord",
      href: `https://git.door43.org/api/v1/catalog/search?lang=${seed.languageCode}`,
      notice: "Catalog link only. CC BY-SA 4.0. Not hosted here.",
    },
  ];
  if (seed.bible === "Available") {
    links.push({
      label: "Bible audio",
      href: "https://www.faithcomesbyhearing.com/bible-brain/terms-conditions",
      notice: "Link only. Bible Brain streams on their site, with their copyright notice and terms. Not played here.",
    });
  }
  return links;
}

function fromSeed(seed: SampleSeed): ViewGroup {
  const rounded = isRestrictedAccessCountry(seed.countryCode);
  return {
    pgid: seed.pgid,
    name: seed.name,
    nativeName: seed.nativeName,
    country: seed.country,
    countryCode: seed.countryCode,
    usStates: seed.usStates ?? [],
    population: seed.population,
    languageName: seed.languageName,
    languageCode: seed.languageCode,
    religion: seed.religion,
    unreached: seed.evangelicalLevel.toLowerCase().includes("less than 2"),
    evangelicalBand: seed.evangelicalLevel,
    summary: seed.summary ?? null,
    latitude: rounded ? roundTo1Decimal(seed.lat) : seed.lat,
    longitude: rounded ? roundTo1Decimal(seed.lng) : seed.lng,
    coordinatesRounded: rounded,
    bible: seed.bible ?? null,
    jesusFilm: seed.jesusFilm ?? null,
    audio: seed.audio ?? null,
    links: linksFor(seed),
    dataDate: seed.dataDate ?? "2026-11-23",
  };
}

export function getCatalog(): Catalog {
  return {
    mode: "sample",
    sampleLabel: "Sample data",
    attribution: ATTRIBUTION,
    groups: SAMPLE_SEEDS.map(fromSeed).sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
  };
}

export function getGroup(pgid: string): ViewGroup | undefined {
  return getCatalog().groups.find((group) => group.pgid === pgid);
}

export function stateCounts(groups: ViewGroup[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const group of groups) {
    if (group.unreached !== true) continue;
    for (const state of group.usStates) counts[state] = (counts[state] ?? 0) + 1;
  }
  return counts;
}

export function countryCounts(groups: ViewGroup[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const group of groups) {
    if (group.unreached !== true || !group.countryCode) continue;
    counts[group.countryCode] = (counts[group.countryCode] ?? 0) + 1;
  }
  return counts;
}
