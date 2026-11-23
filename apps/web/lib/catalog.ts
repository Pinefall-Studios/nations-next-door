import { isRestrictedAccessCountry, roundTo1Decimal } from "../../../src/core/restricted";
import { SAMPLE_SEEDS, type SampleSeed } from "./sample";
import type { Catalog, ResourceLink, ScriptureRow, ViewGroup } from "./view";

/** Public Bible.is listings (Bible Brain). Link only; nothing is streamed here. */
const BIBLE_LISTING: Record<string, string> = {
  fon: "https://live.bible.is/bible/FONBSB",
  prs: "https://live.bible.is/bible/PRSGNN",
  kan: "https://live.bible.is/bible/KANWTC",
  ntm: "https://live.bible.is/bible/NTMWBT",
};

const JESUS_LISTING: Record<string, string> = {
  fon: "https://www.jesusfilm.org/watch/jesus.html/fon-gbe.html",
  prs: "https://www.jesusfilm.org/watch/jesus.html/dari.html",
  kan: "https://www.jesusfilm.org/watch/jesus.html/kannada.html",
};

const GOSPEL_LISTING: Record<string, string> = {
  fon: "https://globalrecordings.net/en/language/fon",
  prs: "https://globalrecordings.net/en/language/prs",
  kan: "https://globalrecordings.net/en/language/kan",
  ntm: "https://globalrecordings.net/en/language/ntm",
};

const BIBLE_NOTICE =
  "Link only. This opens the Bible.is listing for this language, from Bible Brain. It streams on their site, with their copyright notice and terms. Not played here.";

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
  const bible = seed.bible === "Available" ? BIBLE_LISTING[seed.languageCode] : undefined;
  if (bible) {
    links.push({
      label: "Bible audio",
      href: bible,
      notice: BIBLE_NOTICE,
    });
  }
  return links;
}

function scriptureFor(seed: SampleSeed): ScriptureRow[] {
  const bible = seed.bible === "Available" ? BIBLE_LISTING[seed.languageCode] : undefined;
  const audio = seed.audio === "Available" ? BIBLE_LISTING[seed.languageCode] : undefined;
  const jesus = seed.jesusFilm === "Available" ? JESUS_LISTING[seed.languageCode] : undefined;
  const gospel = seed.gospel === "Available" ? GOSPEL_LISTING[seed.languageCode] : undefined;
  return [
    { label: "Bible", href: bible ?? null, linkText: bible ? "Bible.is" : null },
    { label: "Jesus Film", href: jesus ?? null, linkText: jesus ? "Jesus Film" : null },
    { label: "Audio", href: audio ?? null, linkText: audio ? "Bible.is" : null },
    { label: "Gospel", href: gospel ?? null, linkText: gospel ? "Global Recordings Network" : null },
    { label: "Stories", href: null, linkText: null },
    { label: "Radio", href: null, linkText: null },
  ];
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
    gospel: seed.gospel ?? null,
    stories: seed.stories ?? null,
    radio: seed.radio ?? null,
    links: linksFor(seed),
    scripture: scriptureFor(seed),
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
