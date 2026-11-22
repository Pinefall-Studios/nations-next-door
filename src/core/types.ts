import type { SourceCitation } from "./attribution.js";

export type ReachedStatus = "unreached" | "reached" | "unknown";

export type PopulationContext = "indigenous" | "diaspora";

export interface ScriptureAvailability {
  bible: string | null;
  jesusFilm: string | null;
  audio: string | null;
  gospel: string | null;
  stories: string | null;
  radio: string | null;
  resourceTotal: number | null;
}

/**
 * Public aggregate fields only. Built by copying an allowlist, never by
 * deleting keys from the provider payload.
 */
export interface PublicPeopleGroup {
  pgid: string;
  peid: number | null;
  name: string;
  alternateNames: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  subregion: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  /** Postal codes. Empty when the group is not in the United States. */
  usStates: string[];
  primaryLanguage: {
    name: string | null;
    /** ISO 639-3 / ROL code. */
    code: string | null;
    family: string | null;
  };
  religion: {
    name: string | null;
    code: string | null;
  };
  evangelicalLevel: string | null;
  reachedStatus: ReachedStatus;
  /** Global Status of Evangelical Christianity, 0 through 6. The narrative, which mixes in church-planting activity, is not included. */
  gsec: number | null;
  lostness: string | null;
  populationContext: PopulationContext | null;
  summary: string | null;
  scriptureAvailability: ScriptureAvailability;
  /** IMB capture or update date, YYYY-MM-DD, when the payload has one. */
  dataDate: string | null;
}

export interface PeopleGroupList {
  total: number;
  limit: number;
  offset: number;
  groups: PublicPeopleGroup[];
  attribution: string;
  sources: SourceCitation[];
  retrievedAt: string;
  geographyNote?: string;
}

export interface PeopleGroupDetails {
  group: PublicPeopleGroup;
  attribution: string;
  sources: SourceCitation[];
  retrievedAt: string;
}
