import Link from "next/link";
import { Noto_Sans_Kannada } from "next/font/google";
import { PatternTile } from "./PatternTile";

const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["500"] });
import type { ViewGroup } from "../lib/view";

export function GroupList({ groups }: { groups: ViewGroup[] }) {
  if (groups.length === 0) {
    return <p className="quiet">No groups in this sample match. Try Texas, Benin, or clearing a filter.</p>;
  }
  return (
    <div className="group-list">
      {groups.map((group) => (
        <Link key={group.pgid} href={`/groups/${group.pgid}`} className="group-card">
          <PatternTile name={group.name} />
          <div>
            <h3>{group.name}</h3>
            {group.nativeName ? (
              <p className={`${kannada.className} native`} lang={group.languageCode === "kan" ? "kn" : undefined}>
                {group.nativeName}
              </p>
            ) : null}
            <p>
              {group.country}
              {group.usStates.length > 0 ? ` · ${group.usStates.join(", ")}` : ""} ·{" "}
              {group.languageName} ({group.languageCode})
            </p>
            <p className="nums">
              {group.population?.toLocaleString("en-US") ?? "Population not listed"} · Unreached:{" "}
              {group.unreached ? "yes" : "no"} · {group.evangelicalBand}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
