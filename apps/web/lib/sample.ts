/**
 * Frozen public fields from PeopleGroups.org, checked 22–23 November 2026.
 * This is a sample for the concept, not a live extract and not a mirror.
 * No engagement text, no photos, no location narratives.
 */
export type SampleSeed = {
  pgid: string;
  name: string;
  nativeName: string | null;
  country: string;
  countryCode: string;
  population: number;
  languageName: string;
  languageCode: string;
  religion: string;
  evangelicalLevel: string;
  lat: number;
  lng: number;
  /** States named on the public record. The prose itself is not stored. */
  usStates?: string[];
  bible?: string | null;
  jesusFilm?: string | null;
  audio?: string | null;
  gospel?: string | null;
  stories?: string | null;
  radio?: string | null;
  summary?: string;
  dataDate?: string;
};

export const SAMPLE_SEEDS: SampleSeed[] = [
  {
    pgid: "PG012319",
    name: "Fon",
    nativeName: null,
    country: "Benin",
    countryCode: "BEN",
    population: 3740000,
    languageName: "Fon",
    languageCode: "fon",
    religion: "Christianity - Protestantism",
    evangelicalLevel: "Less than 2%",
    lat: 7.18,
    lng: 2.07,
    bible: "Available",
    jesusFilm: "Available",
    audio: "Available",
    gospel: "Available",
    stories: "Not Available",
    radio: "Available",
  },
  {
    pgid: "PG023938",
    name: "Aimaq",
    nativeName: null,
    country: "Afghanistan",
    countryCode: "AFG",
    population: 1480000,
    languageName: "Dari",
    languageCode: "prs",
    religion: "Islam - Sunni",
    evangelicalLevel: "Less than 2%",
    lat: 34.27,
    lng: 64.62,
    bible: "Available",
    jesusFilm: "Available",
    audio: "Available",
    gospel: "Available",
    stories: "Not Available",
    radio: "Available",
  },
  {
    pgid: "PG049288",
    name: "Quiche",
    nativeName: "K'iche'",
    country: "United States",
    countryCode: "USA",
    population: 284000,
    languageName: "K'iche'",
    languageCode: "quc",
    religion: "Ethnoreligion",
    evangelicalLevel: "Less than 2%",
    lat: 29.76,
    lng: -95.36,
    usStates: ["TX"],
  },
  {
    pgid: "PG043186",
    name: "Cajuns",
    nativeName: null,
    country: "United States",
    countryCode: "USA",
    population: 79000,
    languageName: "English",
    languageCode: "eng",
    religion: "Christianity - Roman Catholicism",
    evangelicalLevel: "Less than 2%",
    lat: 29.69,
    lng: -91.61,
    usStates: ["LA", "MS", "TX"],
  },
  {
    pgid: "PG047200",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    country: "United States",
    countryCode: "USA",
    population: 55500,
    languageName: "Kannada",
    languageCode: "kan",
    religion: "Hinduism",
    evangelicalLevel: "Less than 2%",
    lat: 29.77,
    lng: -95.37,
    usStates: ["TX"],
    bible: "Available",
    jesusFilm: "Available",
    audio: "Available",
    gospel: "Available",
    stories: "Available",
    radio: "Not Available",
  },
  {
    pgid: "PG012345",
    name: "Nateni",
    nativeName: null,
    country: "Benin",
    countryCode: "BEN",
    population: 135000,
    languageName: "Nateni",
    languageCode: "ntm",
    religion: "Ethnoreligion - Animism",
    evangelicalLevel: "Less than 2%",
    lat: 10.52,
    lng: 1.22,
    bible: "Available",
    jesusFilm: "Not Available",
    audio: "Available",
    gospel: "Available",
    stories: "Not Available",
    radio: "Not Available",
    summary: "a Gurma people of northwestern Benin straddling the Togo border, known also as Natemba",
    dataDate: "2026-11-21",
  },
  {
    pgid: "PG000001",
    name: "Andorrans",
    nativeName: null,
    country: "Andorra",
    countryCode: "AND",
    population: 46500,
    languageName: "Catalan",
    languageCode: "cat",
    religion: "Christianity - Roman Catholicism",
    evangelicalLevel: "Less than 2%",
    lat: 42.49,
    lng: 1.52,
  },
  {
    pgid: "PG024737",
    name: "Quiche",
    nativeName: "K'iche'",
    country: "Guatemala",
    countryCode: "GTM",
    population: 3220000,
    languageName: "K'iche'",
    languageCode: "quc",
    religion: "Ethnoreligion",
    evangelicalLevel: "2% or Greater but Less than 5%",
    lat: 14.82,
    lng: -91.33,
    bible: "Available",
    jesusFilm: "Available",
    audio: "Available",
    gospel: "Available",
    stories: "Not Available",
    radio: "Not Available",
  },
];
