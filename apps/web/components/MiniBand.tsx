import { BAND_COLORS, bandIndex } from "../lib/band-color";

export function MiniBand({ band }: { band: string | null }) {
  const marked = bandIndex(band);
  return (
    <span className="band-mini" aria-label={`Evangelical band ${band ?? "not stated"}`}>
      {BAND_COLORS.map((color, index) => (
        <i key={color} className={index === marked ? "is-marked" : undefined} style={{ background: color }} />
      ))}
    </span>
  );
}
