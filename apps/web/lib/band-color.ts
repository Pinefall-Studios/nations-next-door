export const BAND_COLORS = ["#F6E3D6", "#E9B99A", "#D58A60", "#B4532A", "#7E3418"] as const;

export function bandIndex(band: string | null): number {
  if (!band) return 2;
  const value = band.toLowerCase();
  if (value.includes("less than 2") || value.includes("<2") || value.includes("< 2")) return 4;
  if (value.includes("less than 5")) return 3;
  if (value.includes("less than 10")) return 2;
  if (value.includes("less than 20") || value.includes("10%")) return 1;
  return 0;
}

export function bandColor(band: string | null): string {
  return BAND_COLORS[bandIndex(band)] ?? "#B4532A";
}

export function pointRadius(population: number | null): number {
  const value = Math.max(population ?? 0, 0);
  const scaled = 6 + 12 * Math.min(1, Math.sqrt(value / 5_000_000));
  return Math.round(scaled);
}
