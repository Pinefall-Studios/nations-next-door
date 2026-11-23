import type { PublicPeopleGroup } from "../../../src/core/types";
import type { ResourceLink, ScriptureRow, ViewGroup } from "./view";

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
  const links: ResourceLink[] = [
    {
      label: "unfoldingWord",
      href: `https://git.door43.org/api/v1/catalog/search?lang=${language ?? ""}`,
      notice: "Catalog link only. CC BY-SA 4.0. Not hosted here.",
    },
  ];
  if (bibleHref) {
    links.push({
      label: "Bible audio",
      href: bibleHref,
      notice:
        "Link only. This opens a Bible.is or Scripture Earth listing for this language, from Bible Brain. It streams on their site. Not played here.",
    });
  }
  const scripture: ScriptureRow[] = [
    { label: "Bible", href: bibleHref, linkText: bibleHref ? "Bible listing" : null },
    {
      label: "Jesus Film",
      href: group.scriptureAvailability.jesusFilm === "Available" && language
        ? `https://www.scriptureearth.org/00eng.php?iso=${language}`
        : null,
      linkText: group.scriptureAvailability.jesusFilm === "Available" ? "Scripture Earth" : null,
    },
    { label: "Audio", href: bibleHref, linkText: bibleHref ? "Bible listing" : null },
    {
      label: "Gospel",
      href: group.scriptureAvailability.gospel === "Available" && language
        ? `https://globalrecordings.net/en/language/${language}`
        : null,
      linkText: group.scriptureAvailability.gospel === "Available" ? "Global Recordings Network" : null,
    },
    { label: "Stories", href: null, linkText: null },
    { label: "Radio", href: null, linkText: null },
  ];
  return {
    pgid: group.pgid,
    name: group.name,
    nativeName: null,
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
    links,
    scripture,
    dataDate: group.dataDate,
  };
}
