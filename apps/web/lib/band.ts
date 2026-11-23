/** Short evangelical-band labels. The stored value stays the public source wording. */
export function shortBand(band: string | null): string {
  if (!band) return "Not stated";
  const value = band.toLowerCase();
  if (/less than 20/.test(value)) return "10–20%";
  if (/less than 10/.test(value)) return "5–10%";
  if (/less than 5/.test(value)) return "2–5%";
  if (/less than 2/.test(value) || /<\s*2(?:\.0+)?\s*%/.test(value)) return "Under 2%";
  if (value.includes("%")) return "20%+";
  return band;
}
