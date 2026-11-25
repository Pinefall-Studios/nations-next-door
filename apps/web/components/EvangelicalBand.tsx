const STEPS = [
  { long: "20% or more", short: "20%+", color: "#F6E3D6" },
  { long: "10–20%", short: "10–20%", color: "#E9B99A" },
  { long: "5–10%", short: "5–10%", color: "#D58A60" },
  { long: "2–5%", short: "2–5%", color: "#B4532A" },
  { long: "Under 2%", short: "<2%", color: "#7E3418" },
] as const;

function markedIndex(band: string | null): number | null {
  if (!band) return null;
  const value = band.toLowerCase();
  if (value.includes("less than 2") || value.includes("< 2") || value.includes("<2")) return 4;
  if (value.includes("less than 5")) return 3;
  if (value.includes("less than 10")) return 2;
  if (value.includes("less than 20") || value.includes("10%")) return 1;
  if (value.includes("%")) return 0;
  return null;
}

export function EvangelicalBand({
  band,
  unreached,
}: {
  band: string | null;
  unreached: boolean | null;
}) {
  const marked = markedIndex(band);
  const answer = unreached === null ? "not stated" : unreached ? "yes" : "no";
  return (
    <div className="band">
      <p className="status">Unreached: {answer}.</p>
      <div className="band-strip" role="img" aria-label={`Evangelical band ${band ?? "not stated"}`}>
        {STEPS.map((step, index) => (
          <div key={step.short} className={index === marked ? "band-step is-marked" : "band-step"}>
            <i style={{ background: step.color }} />
            <span className="band-long">{step.long}</span>
            <span className="band-short">{step.short}</span>
          </div>
        ))}
      </div>
      <p className="notice">Light is a larger evangelical share. Deep is under 2%.</p>
    </div>
  );
}
