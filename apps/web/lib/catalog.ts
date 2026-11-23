import { unreachedFromBand } from "../../../src/core/project";
import { isRestrictedAccessCountry, roundTo1Decimal } from "../../../src/core/restricted";
import { resourceLinks, scriptureRows } from "./resources";
import { SAMPLE_SEEDS, type SampleSeed } from "./sample";
import type { Catalog, ViewGroup } from "./view";

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

const ATTRIBUTION =
  "This information was provided by The International Mission Board - Global Research, November 2026, Nations Next Door, www.peoplegroups.org";

function linksFor(seed: SampleSeed) {
  const bible = seed.bible === "Available" ? BIBLE_LISTING[seed.languageCode] ?? null : null;
  const audio = seed.audio === "Available" ? BIBLE_LISTING[seed.languageCode] ?? bible : null;
  const jesus = seed.jesusFilm === "Available" ? JESUS_LISTING[seed.languageCode] ?? null : null;
  return resourceLinks({
    languageCode: seed.languageCode,
    bibleHref: bible,
    audioHref: audio,
    jesusHref: jesus,
  });
}

function scriptureFor(seed: SampleSeed) {
  const bible = seed.bible === "Available" ? BIBLE_LISTING[seed.languageCode] ?? null : null;
  const audio = seed.audio === "Available" ? BIBLE_LISTING[seed.languageCode] ?? null : null;
  const jesus = seed.jesusFilm === "Available" ? JESUS_LISTING[seed.languageCode] ?? null : null;
  const gospel = seed.gospel === "Available" ? GOSPEL_LISTING[seed.languageCode] ?? null : null;
  return scriptureRows({ bibleHref: bible, audioHref: audio, jesusHref: jesus, gospelHref: gospel });
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
    unreached: unreachedFromBand(seed.evangelicalLevel),
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
