import Link from "next/link";
import { shortBand } from "../lib/band";
import { resourceChips } from "../lib/resources";
import { PatternTile } from "./PatternTile";
import type { ViewGroup } from "../lib/view";

export function GroupPanel({
  group,
  onAsk,
  onClose,
  compact = false,
}: {
  group: ViewGroup;
  onAsk: () => void;
  onClose?: () => void;
  compact?: boolean;
}) {
  const where = group.usStates.length > 0 ? `${group.country} · ${group.usStates.join(", ")}` : group.country;
  const chips = resourceChips(group);
  return (
    <article className="group-panel">
      <PatternTile name={group.name} />
      <div className="group-panel-body">
        <div className="group-panel-copy">
          <h2>
            <Link href={`/groups/${group.pgid}`}>{group.name}</Link>
          </h2>
          {group.nativeName ? <p className="native">{group.nativeName}</p> : null}
          <p className="where">{where}</p>
          <p className="nums">
            {group.population?.toLocaleString("en-US") ?? "Population not listed"} · {group.languageName}
          </p>
          <p className="band-words">{shortBand(group.evangelicalBand)}</p>
          {chips.length > 0 ? (
            <div className="resource-chips">
              {chips.map((link) => (
                <a
                  key={link.label}
                  className="chip"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  title={link.notice}
                >
                  {link.label}
                </a>
              ))}
              <p className="notice chip-notice">Links open the publisher&apos;s site; their terms apply.</p>
            </div>
          ) : null}
          {compact ? (
            <p className="page-link">
              <Link className="quiet-link" href={`/groups/${group.pgid}`}>Open page</Link>
            </p>
          ) : null}
        </div>
        {onClose ? (
          <div className="actions panel-nav">
            <button type="button" className="btn secondary" onClick={onClose}>Back</button>
          </div>
        ) : null}
        {compact ? null : (
          <div className="actions panel-primary">
            <a className="btn" href={`/groups/${group.pgid}#pray`}>Pray</a>
            <button type="button" className="btn secondary" onClick={onAsk}>Ask</button>
          </div>
        )}
      </div>
    </article>
  );
}
