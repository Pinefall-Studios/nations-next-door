/** Short evangelical-band labels. The stored value stays the public source wording. */
export function shortBand(band: string | null): string {
  if (!band) return "Not stated";
  const value = band.toLowerCase();
  if (value.includes("less than 2") || value.includes("<2") || value.includes("< 2")) return "<2%";
  if (value.includes("less than 5")) return "2–5%";
  if (value.includes("less than 10")) return "5–10%";
  if (value.includes("less than 20") || value.includes("10%")) return "10–20%";
  if (value.includes("%")) return "20%+";
  return band;
}
