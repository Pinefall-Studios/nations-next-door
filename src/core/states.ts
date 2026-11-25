import { UnknownPlaceError } from "./errors.js";
import { fold, hasUnsafeQueryCharacters } from "./text.js";

export interface UsState {
  code: string;
  name: string;
}

interface StateRecord extends UsState {
  phrases: string[];
}

const STATE_RECORDS: StateRecord[] = [
  { code: "AL", name: "Alabama", phrases: [] },
  { code: "AK", name: "Alaska", phrases: [] },
  { code: "AZ", name: "Arizona", phrases: [] },
  { code: "AR", name: "Arkansas", phrases: [] },
  { code: "CA", name: "California", phrases: [] },
  { code: "CO", name: "Colorado", phrases: [] },
  { code: "CT", name: "Connecticut", phrases: [] },
  { code: "DE", name: "Delaware", phrases: [] },
  { code: "DC", name: "District of Columbia", phrases: ["washington dc", "washington d c"] },
  { code: "FL", name: "Florida", phrases: [] },
  { code: "GA", name: "Georgia", phrases: [] },
  { code: "HI", name: "Hawaii", phrases: [] },
  { code: "ID", name: "Idaho", phrases: [] },
  { code: "IL", name: "Illinois", phrases: [] },
  { code: "IN", name: "Indiana", phrases: [] },
  { code: "IA", name: "Iowa", phrases: [] },
  { code: "KS", name: "Kansas", phrases: [] },
  { code: "KY", name: "Kentucky", phrases: [] },
  { code: "LA", name: "Louisiana", phrases: [] },
  { code: "ME", name: "Maine", phrases: [] },
  { code: "MD", name: "Maryland", phrases: [] },
  { code: "MA", name: "Massachusetts", phrases: [] },
  { code: "MI", name: "Michigan", phrases: [] },
  { code: "MN", name: "Minnesota", phrases: [] },
  { code: "MS", name: "Mississippi", phrases: [] },
  { code: "MO", name: "Missouri", phrases: [] },
  { code: "MT", name: "Montana", phrases: [] },
  { code: "NE", name: "Nebraska", phrases: [] },
  { code: "NV", name: "Nevada", phrases: [] },
  { code: "NH", name: "New Hampshire", phrases: [] },
  { code: "NJ", name: "New Jersey", phrases: [] },
  { code: "NM", name: "New Mexico", phrases: [] },
  { code: "NY", name: "New York", phrases: [] },
  { code: "NC", name: "North Carolina", phrases: [] },
  { code: "ND", name: "North Dakota", phrases: [] },
  { code: "OH", name: "Ohio", phrases: [] },
  { code: "OK", name: "Oklahoma", phrases: [] },
  { code: "OR", name: "Oregon", phrases: [] },
  { code: "PA", name: "Pennsylvania", phrases: [] },
  { code: "RI", name: "Rhode Island", phrases: [] },
  { code: "SC", name: "South Carolina", phrases: [] },
  { code: "SD", name: "South Dakota", phrases: [] },
  { code: "TN", name: "Tennessee", phrases: [] },
  { code: "TX", name: "Texas", phrases: [] },
  { code: "UT", name: "Utah", phrases: [] },
  { code: "VT", name: "Vermont", phrases: [] },
  { code: "VA", name: "Virginia", phrases: [] },
  { code: "WA", name: "Washington", phrases: ["washington state"] },
  { code: "WV", name: "West Virginia", phrases: [] },
  { code: "WI", name: "Wisconsin", phrases: [] },
  { code: "WY", name: "Wyoming", phrases: [] },
];

const TERRITORIES: Record<string, string> = {
  "puerto rico": "Puerto Rico",
  guam: "Guam",
  "american samoa": "American Samoa",
  "virgin islands": "the US Virgin Islands",
  "us virgin islands": "the US Virgin Islands",
  "united states virgin islands": "the US Virgin Islands",
  "northern mariana islands": "the Northern Mariana Islands",
  "commonwealth of the northern mariana islands": "the Northern Mariana Islands",
};

interface Phrase {
  phrase: string;
  code: string;
}

const PHRASES: Phrase[] = STATE_RECORDS.flatMap((state) => {
  const phrases = new Set([fold(state.name), ...state.phrases.map((phrase) => fold(phrase))]);
  return [...phrases].map((phrase) => ({ phrase, code: state.code }));
}).sort((a, b) => b.phrase.length - a.phrase.length);

const BY_CODE = new Map(STATE_RECORDS.map((state) => [state.code, state]));
const BY_PHRASE = new Map(PHRASES.map((item) => [item.phrase, item.code]));

export function listUsStates(): UsState[] {
  return STATE_RECORDS.map(({ code, name }) => ({ code, name }));
}

export function resolveUsState(input: string): UsState {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 60 || hasUnsafeQueryCharacters(trimmed)) {
    throw new UnknownPlaceError(
      "Unknown US state. Use a state name or postal code such as Texas or TX. This tool covers the 50 states and the District of Columbia.",
    );
  }
  const folded = fold(trimmed);
  const territory = TERRITORIES[folded];
  if (territory) {
    throw new UnknownPlaceError(
      `${territory} is a US territory, and this tool does not cover territories. It covers the 50 states and the District of Columbia. For the whole country, ask for the United States.`,
    );
  }
  const letters = folded.replace(/ /g, "");
  if (/^[a-z]{2}$/.test(letters)) {
    const byCode = BY_CODE.get(letters.toUpperCase());
    if (byCode) return { code: byCode.code, name: byCode.name };
  }
  const code = BY_PHRASE.get(folded);
  if (!code) {
    throw new UnknownPlaceError(
      `Unknown US state "${trimmed}". Use a state name or postal code such as Texas or TX. This tool covers the 50 states and the District of Columbia.`,
    );
  }
  const state = BY_CODE.get(code);
  if (!state) {
    throw new UnknownPlaceError(`Unknown US state "${trimmed}".`);
  }
  return { code: state.code, name: state.name };
}

/**
 * State names mentioned in a location description. Longer names win, so
 * "West Virginia" does not also match Virginia, and "Washington, D.C." does
 * not also match Washington.
 */
export function statesNamedIn(text: string | null | undefined): string[] {
  if (!text) return [];
  let folded = ` ${fold(text)} `;
  const found: string[] = [];
  for (const { phrase, code } of PHRASES) {
    const needle = ` ${phrase} `;
    if (!folded.includes(needle)) continue;
    found.push(code);
    folded = folded.split(needle).join(" ");
  }
  return [...new Set(found)];
}
