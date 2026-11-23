import Link from "next/link";
import { shortBand } from "../lib/band";
import { MiniBand } from "./MiniBand";
import { PatternTile } from "./PatternTile";
import type { ViewGroup } from "../lib/view";

export function GroupPanel({
  group,
  onAsk,
}: {
  group: ViewGroup;
  onAsk: () => void;
}) {
  const where = group.usStates.length > 0 ? `${group.country} · ${group.usStates.join(", ")}` : group.country;
  return (
    <article className="group-panel">
      <PatternTile name={group.name} />
      <div>
        <h2>{group.name}</h2>
        {group.nativeName ? <p className="native">{group.nativeName}</p> : null}
        <p className="where">{where}</p>
        <p className="nums">
          {group.population?.toLocaleString("en-US") ?? "Population not listed"} · {group.languageName}
        </p>
        <p>Unreached: {group.unreached ? "yes" : "no"} · {shortBand(group.evangelicalBand)}</p>
        <MiniBand band={group.evangelicalBand} />
        <div className="actions">
          <a className="btn" href={`/groups/${group.pgid}#pray`}>Pray</a>
          <button type="button" className="btn secondary" onClick={onAsk}>Ask</button>
          <Link className="btn secondary" href={`/groups/${group.pgid}`}>Open page</Link>
        </div>
      </div>
    </article>
  );
}
