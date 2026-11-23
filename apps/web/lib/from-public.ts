import type { PublicPeopleGroup } from "../../../src/core/types";
import { resourceLinks, scriptureRows } from "./resources";
import type { ViewGroup } from "./view";

const BIBLE_LISTING: Record<string, string> = {
  fon: "https://live.bible.is/bible/FONBSB",
  prs: "https://live.bible.is/bible/PRSGNN",
  kan: "https://live.bible.is/bible/KANWTC",
  ntm: "https://live.bible.is/bible/NTMWBT",
};

function listing(code: string | null, known: Record<string, string>, fallback: (code: string) => string): string | null {
  if (!code) return null;
  return known[code] ?? fallback(code);
}

export function fromPublic(group: PublicPeopleGroup): ViewGroup {
  const language = group.primaryLanguage.code;
  const bibleHref =
    group.scriptureAvailability.bible === "Available"
      ? listing(language, BIBLE_LISTING, (code) => `https://www.scriptureearth.org/00eng.php?iso=${code}`)
      : null;
  const jesusHref =
    group.scriptureAvailability.jesusFilm === "Available" && language
      ? `https://www.scriptureearth.org/00eng.php?iso=${language}`
      : null;
  const gospelHref =
    group.scriptureAvailability.gospel === "Available" && language
      ? `https://globalrecordings.net/en/language/${language}`
      : null;
  const audioHref = bibleHref;
  return {
    pgid: group.pgid,
    name: group.name,
    nativeName: group.nativeName,
    country: group.country,
    countryCode: group.countryCode,
    usStates: group.usStates,
    population: group.population,
    languageName: group.primaryLanguage.name,
    languageCode: language,
    religion: group.religion.name,
    unreached: group.unreached,
    evangelicalBand: group.evangelicalBand,
    summary: group.summary,
    latitude: group.latitude,
    longitude: group.longitude,
    coordinatesRounded: group.coordinatesRounded,
    bible: group.scriptureAvailability.bible,
    jesusFilm: group.scriptureAvailability.jesusFilm,
    audio: group.scriptureAvailability.audio,
    gospel: group.scriptureAvailability.gospel,
    stories: group.scriptureAvailability.stories,
    radio: group.scriptureAvailability.radio,
    links: resourceLinks({
      languageCode: language,
      bibleHref: group.scriptureAvailability.bible === "Available" ? bibleHref : null,
      audioHref:
        group.scriptureAvailability.audio === "Available" || group.scriptureAvailability.bible === "Available"
          ? audioHref
          : null,
      jesusHref,
    }),
    scripture: scriptureRows({ bibleHref, audioHref, jesusHref, gospelHref }),
    dataDate: group.dataDate,
  };
}
