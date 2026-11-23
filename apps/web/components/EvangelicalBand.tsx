const STEPS = [
  { label: "20% or more", color: "#F6E3D6" },
  { label: "10–20%", color: "#E9B99A" },
  { label: "5–10%", color: "#D58A60" },
  { label: "2–5%", color: "#B4532A" },
  { label: "Under 2%", color: "#7E3418" },
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
          <div key={step.label} className={index === marked ? "band-step is-marked" : "band-step"}>
            <i style={{ background: step.color }} />
            <span>{step.label}</span>
          </div>
        ))}
      </div>
      <p className="notice">
        {band ? `This group: ${band}.` : "Evangelical band not stated."} Light is a larger evangelical share. Deep is under 2%.
      </p>
    </div>
  );
}
