import { isRestrictedAccessCountry, roundTo1Decimal } from "./restricted.js";
import { stateForPoint } from "./state-geometry.js";
import { statesNamedIn } from "./states.js";
import type { PopulationContext, PublicPeopleGroup, ScriptureAvailability } from "./types.js";

const UNSAFE_PROSE =
  /field worker|missionar|local believer|\bbelievers?\b|church planting|congregation|engagement status/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pick(raw: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const value = raw[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return undefined;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function wholeNumber(value: unknown): number | null {
  const parsed = finiteNumber(value);
  if (parsed === null) return null;
  return Math.round(parsed);
}

function shortText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || UNSAFE_PROSE.test(trimmed)) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function languageCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toLowerCase();
  return /^[a-z]{3}$/.test(code) ? code : null;
}

function countryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function populationContext(value: unknown): PopulationContext | null {
  if (typeof value !== "string") return null;
  const folded = value.trim().toLowerCase();
  if (folded === "indigenous") return "indigenous";
  if (folded === "diaspora") return "diaspora";
  return null;
}

function isoDate(value: unknown): string | null {
  if (typeof value === "number" || (typeof value === "string" && /^\d{11,}$/.test(value.trim()))) {
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }
  if (typeof value !== "string" || value.trim() === "") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value.trim())) return value.trim().slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

const ENGAGEMENT_PROSE = /plant|engag|worker|missionar|believer|congregat|gsec/i;

/**
 * IMB defines an unreached people group as less than 2% evangelical.
 * The band is the only input. GSEC is not read.
 */
export function unreachedFromBand(band: string | null): boolean | null {
  if (!band) return null;
  const value = band.toLowerCase();
  if (value.includes("less than 2") || value.includes("< 2") || value.includes("<2")) return true;
  const numeric = value.match(/(\d+(?:\.\d+)?)\s*%/);
  const first = numeric?.[1];
  if (first !== undefined) {
    const percent = Number(first);
    if (Number.isFinite(percent)) return percent < 2;
  }
  return null;
}

function evangelicalBand(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || UNSAFE_PROSE.test(trimmed) || ENGAGEMENT_PROSE.test(trimmed)) return null;
  if (!trimmed.includes("%") && !/less than 2/i.test(trimmed)) return null;
  return trimmed.length <= 160 ? trimmed : null;
}

function usStatesFor(raw: Record<string, unknown>, code: string | null): string[] {
  if (code !== "USA") return [];
  const states = new Set<string>();
  const latitude = finiteNumber(pick(raw, ["Lat", "Latitude"]));
  const longitude = finiteNumber(pick(raw, ["Long", "Longitude", "Lng"]));
  if (latitude !== null && longitude !== null) {
    const hit = stateForPoint(latitude, longitude);
    if (hit) states.add(hit);
  }
  // The location prose is used only to read US state names, then discarded.
  const location = pick(raw, ["LocationDescription", "LocationDesc"]);
  if (typeof location === "string") {
    for (const state of statesNamedIn(location)) states.add(state);
  }
  return [...states].sort();
}

function publishCoordinates(
  raw: Record<string, unknown>,
  code: string | null,
): { latitude: number | null; longitude: number | null; coordinatesRounded: boolean } {
  const latitude = finiteNumber(pick(raw, ["Lat", "Latitude"]));
  const longitude = finiteNumber(pick(raw, ["Long", "Longitude", "Lng"]));
  const restricted = isRestrictedAccessCountry(code);
  if (!restricted) {
    return { latitude, longitude, coordinatesRounded: false };
  }
  return {
    latitude: latitude === null ? null : roundTo1Decimal(latitude),
    longitude: longitude === null ? null : roundTo1Decimal(longitude),
    coordinatesRounded: latitude !== null || longitude !== null,
  };
}

function scripture(raw: Record<string, unknown>): ScriptureAvailability {
  return {
    bible: shortText(pick(raw, ["BibleAvailability", "Bible"]), 80),
    jesusFilm: shortText(pick(raw, ["JesusFilmAvailability", "Jesus"]), 80),
    audio: shortText(pick(raw, ["AudioResourceAvailability"]), 80),
    gospel: shortText(pick(raw, ["GospelResourceAvailability"]), 80),
    stories: shortText(pick(raw, ["BibleStoriesAvailability"]), 80),
    radio: shortText(pick(raw, ["RadioProgramAvailability"]), 80),
    resourceTotal: wholeNumber(pick(raw, ["ResourceTotal", "ResTot"])),
  };
}

/** Copy the public allowlist. Every other key on the raw record is discarded. */
export function toPublicPeopleGroup(raw: unknown): PublicPeopleGroup | null {
  if (!isRecord(raw)) return null;
  const pgidValue = pick(raw, ["PGID", "pgid"]);
  if (typeof pgidValue !== "string" || !/^PG[A-Za-z0-9_-]{1,32}$/i.test(pgidValue.trim())) {
    return null;
  }
  const pgid = pgidValue.trim().toUpperCase();
  const code = countryCode(pick(raw, ["ISOAlpha3", "ISOalpha3", "CountryCode"]));
  const band = evangelicalBand(pick(raw, ["EvangelicalLevel", "EvngLvl"]));
  const percent = band ? null : finiteNumber(pick(raw, ["EvngPct", "EvangelicalPercent"]));
  const evangelicalBandText =
    band ?? (percent === null ? null : `${percent}% evangelical`);
  const coordinates = publishCoordinates(raw, code);
  const name =
    shortText(pick(raw, ["DisplayName", "NmDisp", "Name"]), 200) ?? pgid;

  return {
    pgid,
    peid: wholeNumber(pick(raw, ["PEID"])),
    name,
    alternateNames: shortText(pick(raw, ["AlternateNames", "NmAlt"]), 300),
    country: shortText(pick(raw, ["CountryName", "Ctry", "CountryDisplayName"]), 80),
    countryCode: code,
    region: shortText(pick(raw, ["UNm49RegionName", "Regn"]), 80),
    subregion: shortText(pick(raw, ["UNm49SubRegionName", "RegnSub"]), 80),
    population: wholeNumber(pick(raw, ["Population", "Pop"])),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    coordinatesRounded: coordinates.coordinatesRounded,
    usStates: usStatesFor(raw, code),
    primaryLanguage: {
      name: shortText(pick(raw, ["LanguageName", "Lang"]), 120),
      code: languageCode(pick(raw, ["LanguageCode", "ROL", "ROLROLV"])),
      family: shortText(pick(raw, ["LanguageFamily", "LangFamily"]), 120),
    },
    religion: {
      name: shortText(pick(raw, ["ReligionName", "Rlgn", "ReligionDisplayName"]), 160),
      code: shortText(pick(raw, ["ReligionCode", "ROR"]), 16),
    },
    unreached: unreachedFromBand(evangelicalBandText),
    evangelicalBand: evangelicalBandText,
    populationContext: populationContext(pick(raw, ["Indigenous"])),
    summary: shortText(pick(raw, ["Description", "PeopleDesc"]), 800),
    scriptureAvailability: scripture(raw),
    dataDate:
      isoDate(pick(raw, ["CaptureDate"])) ?? isoDate(pick(raw, ["UpdatedDate"])),
  };
}
