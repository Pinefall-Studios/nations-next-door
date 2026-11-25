/**
 * Countries where published people-group points are rounded before we return
 * them. The set is the Open Doors World Watch List 2026 top 50, the public
 * ranking of countries where Christians face the most extreme persecution:
 * https://www.opendoors.org/persecution/countries (checked 22 November 2026).
 * It is not an IMB field, and it is not a Joshua Project security level.
 */
const WORLD_WATCH_LIST_2026 = [
  "PRK", "SOM", "YEM", "SDN", "ERI", "SYR", "NGA", "PAK", "LBY", "IRN",
  "AFG", "IND", "SAU", "MMR", "MLI", "BFA", "CHN", "IRQ", "MDV", "DZA",
  "MRT", "CAF", "MAR", "CUB", "UZB", "NER", "TJK", "LAO", "COD", "MEX",
  "TUN", "NIC", "BGD", "BTN", "TKM", "ETH", "CMR", "OMN", "MOZ", "KGZ",
  "TUR", "EGY", "COM", "QAT", "KAZ", "NPL", "COL", "TCD", "JOR", "BRN",
] as const;

const RESTRICTED = new Set<string>(WORLD_WATCH_LIST_2026);

export function isRestrictedAccessCountry(isoAlpha3: string | null): boolean {
  if (!isoAlpha3) return false;
  return RESTRICTED.has(isoAlpha3.toUpperCase());
}

/** About 11 km. Used only for restricted-access countries. */
export function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}
