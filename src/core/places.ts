import iso3166 from "./data/iso3166.json" with { type: "json" };
import { UnknownPlaceError, InvalidQueryError } from "./errors.js";
import { fold, hasUnsafeQueryCharacters } from "./text.js";

interface CountryCode {
  name: string;
  alpha2: string;
  alpha3: string;
}

const countries = iso3166 as CountryCode[];

/**
 * Common names that are not the ISO short name, or that IMB spells differently
 * ("Turkiye", "Viet Nam"). The value sent to PeopleGroups.org is the alpha-3
 * code, which the API accepts.
 */
const ALIASES: Record<string, string> = {
  "united states": "USA",
  "u s": "USA",
  "u s a": "USA",
  "united kingdom": "GBR",
  uk: "GBR",
  "u k": "GBR",
  "great britain": "GBR",
  britain: "GBR",
  russia: "RUS",
  turkey: "TUR",
  turkiye: "TUR",
  vietnam: "VNM",
  "viet nam": "VNM",
  laos: "LAO",
  syria: "SYR",
  iran: "IRN",
  bolivia: "BOL",
  venezuela: "VEN",
  tanzania: "TZA",
  moldova: "MDA",
  micronesia: "FSM",
  brunei: "BRN",
  taiwan: "TWN",
  "south korea": "KOR",
  "republic of korea": "KOR",
  "north korea": "PRK",
  dprk: "PRK",
  "czech republic": "CZE",
  czechia: "CZE",
  "ivory coast": "CIV",
  "cote d ivoire": "CIV",
  burma: "MMR",
  myanmar: "MMR",
  swaziland: "SWZ",
  eswatini: "SWZ",
  "cape verde": "CPV",
  "cabo verde": "CPV",
  "east timor": "TLS",
  "timor leste": "TLS",
  macedonia: "MKD",
  "north macedonia": "MKD",
  "democratic republic of the congo": "COD",
  "dr congo": "COD",
  drc: "COD",
  "congo kinshasa": "COD",
  "republic of the congo": "COG",
  "congo brazzaville": "COG",
  palestine: "PSE",
  "the bahamas": "BHS",
  "the gambia": "GMB",
};

const AMBIGUOUS: Record<string, string> = {
  korea: "Say South Korea or North Korea. Korea alone is not a country in this data.",
  congo:
    "Say Democratic Republic of the Congo or Republic of the Congo. Congo alone is ambiguous.",
};

function buildNameIndex(): Map<string, string> {
  const names = new Map<string, string>();
  const add = (key: string, alpha3: string) => {
    const existing = names.get(key);
    if (existing && existing !== alpha3) return;
    names.set(key, alpha3);
  };
  for (const country of countries) {
    add(fold(country.name), country.alpha3);
    const withoutQualifier = country.name.split(" (")[0];
    if (withoutQualifier && withoutQualifier !== country.name) {
      add(fold(withoutQualifier), country.alpha3);
    }
  }
  return names;
}

const NAMES = buildNameIndex();
const ALPHA2 = new Map(countries.map((country) => [country.alpha2, country.alpha3]));
const ALPHA3 = new Set(countries.map((country) => country.alpha3));

export function resolveCountry(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > 80 || hasUnsafeQueryCharacters(trimmed)) {
    throw new InvalidQueryError("Country should be a name or ISO code, such as India or USA.");
  }
  const folded = fold(trimmed);
  const ambiguous = AMBIGUOUS[folded];
  if (ambiguous) throw new UnknownPlaceError(ambiguous);
  const alias = ALIASES[folded];
  if (alias) return alias;
  const named = NAMES.get(folded);
  if (named) return named;
  const letters = folded.replace(/ /g, "");
  if (/^[a-z]{2}$/.test(letters)) {
    const alpha3 = ALPHA2.get(letters.toUpperCase());
    if (alpha3) return alpha3;
  }
  if (/^[a-z]{3}$/.test(letters) && ALPHA3.has(letters.toUpperCase())) {
    return letters.toUpperCase();
  }
  throw new UnknownPlaceError(
    `No country match for "${trimmed}". Use an English name or an ISO code such as India, USA, or US. Two-letter codes here are countries, so GA is Gabon and CA is Canada.`,
  );
}
