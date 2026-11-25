import type { ResourceLink, ScriptureRow, ViewGroup } from "./view";

const BIBLE_NOTICE =
  "Link only. This opens a Bible.is or Scripture Earth listing for this language, from Bible Brain. It streams on their site, with their copyright notice and terms. Not played here.";
const AUDIO_NOTICE =
  "Link only. Audio streams on Bible.is or Scripture Earth, from Bible Brain. Not played here.";
const JESUS_NOTICE =
  "Link only. This opens a Scripture Earth or Jesus Film listing. It plays on their site. Not hosted here.";
const UNFOLDING_NOTICE = "Catalog link only. unfoldingWord Door43 catalog, CC BY-SA 4.0. Not hosted here.";

export function unfoldingWordHref(languageCode: string | null): string {
  return `https://git.door43.org/api/v1/catalog/search?lang=${languageCode ?? ""}`;
}

export function resourceLinks(input: {
  languageCode: string | null;
  bibleHref: string | null;
  audioHref: string | null;
  jesusHref: string | null;
}): ResourceLink[] {
  const links: ResourceLink[] = [];
  if (input.bibleHref) {
    links.push({ label: "Bible", href: input.bibleHref, notice: BIBLE_NOTICE });
  }
  if (input.audioHref) {
    links.push({ label: "Audio", href: input.audioHref, notice: AUDIO_NOTICE });
  }
  if (input.jesusHref) {
    links.push({ label: "JESUS film", href: input.jesusHref, notice: JESUS_NOTICE });
  }
  links.push({
    label: "unfoldingWord",
    href: unfoldingWordHref(input.languageCode),
    notice: UNFOLDING_NOTICE,
  });
  return links;
}

export function resourceChips(group: ViewGroup): ResourceLink[] {
  if (group.links.length > 0) return group.links;
  const bible = group.scripture.find((row) => row.label === "Bible" && row.href)?.href ?? null;
  const audio = group.scripture.find((row) => row.label === "Audio" && row.href)?.href ?? bible;
  const jesus = group.scripture.find((row) => /jesus/i.test(row.label) && row.href)?.href ?? null;
  return resourceLinks({
    languageCode: group.languageCode,
    bibleHref: group.bible === "Available" ? bible : null,
    audioHref: group.audio === "Available" ? audio : null,
    jesusHref: group.jesusFilm === "Available" ? jesus : null,
  });
}

export function scriptureRows(input: {
  bibleHref: string | null;
  audioHref: string | null;
  jesusHref: string | null;
  gospelHref: string | null;
}): ScriptureRow[] {
  return [
    { label: "Bible", href: input.bibleHref, linkText: input.bibleHref ? "Bible listing" : null },
    { label: "Jesus Film", href: input.jesusHref, linkText: input.jesusHref ? "Scripture Earth" : null },
    { label: "Audio", href: input.audioHref, linkText: input.audioHref ? "Bible listing" : null },
    { label: "Gospel", href: input.gospelHref, linkText: input.gospelHref ? "Global Recordings Network" : null },
    { label: "Stories", href: null, linkText: null },
    { label: "Radio", href: null, linkText: null },
  ];
}
