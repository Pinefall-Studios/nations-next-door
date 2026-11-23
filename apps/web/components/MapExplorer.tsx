"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { scaleColor } from "../lib/scale";
import type { MapShape, ViewGroup } from "../lib/view";

export function MapExplorer({
  states,
  countries,
  groups,
}: {
  states: MapShape[];
  countries: MapShape[];
  groups: ViewGroup[];
}) {
  const [scope, setScope] = useState<"states" | "world">("states");
  const [selected, setSelected] = useState<string>("TX");
  const shapes = scope === "states" ? states : countries;
  const listed = useMemo(() => {
    return groups.filter((group) => {
      if (group.unreached !== true) return false;
      if (scope === "states") return group.usStates.includes(selected);
      return group.countryCode === selected;
    });
  }, [groups, scope, selected]);
  const selectedName = shapes.find((shape) => shape.id === selected)?.name ?? selected;

  return (
    <div className="layout with-side">
      <div className="map-card">
        <div className="map-toolbar">
          <div className="segment" role="group" aria-label="Map">
            <button type="button" aria-pressed={scope === "states"} onClick={() => { setScope("states"); setSelected("TX"); }}>
              United States
            </button>
            <button type="button" aria-pressed={scope === "world"} onClick={() => { setScope("world"); setSelected("BEN"); }}>
              World
            </button>
          </div>
          <span className="quiet">Tap a place</span>
        </div>
        <svg className="map-svg" viewBox={scope === "states" ? "0 0 960 560" : "0 0 960 520"} role="img" aria-label="Unreached groups in this sample">
          {shapes.map((shape) => (
            <path
              key={shape.id}
              d={shape.d}
              fill={scaleColor(shape.count)}
              aria-pressed={shape.id === selected}
              role="button"
              tabIndex={0}
              aria-label={`${shape.name}, ${shape.count} unreached groups in this sample`}
              onClick={() => setSelected(shape.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(shape.id);
                }
              }}
            />
          ))}
        </svg>
        <div className="legend">
          <span>fewer believers</span>
          <span className="swatches" aria-hidden="true">
            {["#F6E3D6", "#E9B99A", "#D58A60", "#B4532A", "#7E3418"].map((color) => (
              <i key={color} style={{ background: color }} />
            ))}
          </span>
          <span>→</span>
          <span>Sample only. Land with no color has no group in this set.</span>
        </div>
      </div>
      <aside className="panel" style={{ padding: 18 }}>
        <h2>{selectedName}</h2>
        <p className="quiet">Largest first. Open a group to pray or see language links.</p>
        <div className="group-list">
          {listed.length === 0 ? <p className="quiet">No unreached group from this sample lives here.</p> : null}
          {listed.map((group) => (
            <Link key={group.pgid} href={`/groups/${group.pgid}`} className="group-card">
              <strong>{group.name}</strong>
              <span className="nums">
                {group.population?.toLocaleString("en-US")} · {group.languageName}
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
