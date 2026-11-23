"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Catalog, ViewGroup } from "../lib/view";
import type { MapCommand } from "../lib/map-command";
import { commandFor } from "../lib/map-command";
import { US_STATES } from "../lib/us-states";
import { applyFilters, EMPTY_FILTERS, FilterBar, type Filters } from "./FilterBar";
import { GroupPanel } from "./GroupPanel";
import { LibrarianPanel } from "./LibrarianPanel";
import { MiniBand } from "./MiniBand";
import { SampleBanner, SiteFooter } from "./SiteChrome";

const AtlasMap = dynamic(() => import("./AtlasMap").then((mod) => mod.AtlasMap), { ssr: false });

type HoverInfo = { group: ViewGroup; x: number; y: number };

export function Explore({ initial }: { initial: Catalog }) {
  const [catalog, setCatalog] = useState(initial);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [more, setMore] = useState(false);
  const [scope, setScope] = useState<"us" | "world">("us");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [hoverShown, setHoverShown] = useState<HoverInfo | null>(null);
  const [command, setCommand] = useState<MapCommand | null>(null);
  const [history, setHistory] = useState<MapCommand[]>([]);
  const [bloom, setBloom] = useState(false);
  const [sheet, setSheet] = useState<"peek" | "half" | "full">("peek");
  const [ask, setAsk] = useState(false);
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    fetch("/api/chat").then((res) => res.json()).then((body) => setDemo(Boolean(body.demo))).catch(() => setDemo(true));
    fetch("/api/groups?country=USA&unreached=no")
      .then((res) => res.json())
      .then((body: Catalog) => {
        if (body.groups?.length) setCatalog(body);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!filters.place) return;
    if (US_STATES.some(([code]) => code === filters.place)) return;
    fetch(`/api/groups?country=${encodeURIComponent(filters.place)}&unreached=no`)
      .then((res) => res.json())
      .then((body: Catalog) => {
        if (!body.groups?.length) return;
        setCatalog((current) => {
          const seen = new Set(current.groups.map((group) => group.pgid));
          const extra = body.groups.filter((group) => !seen.has(group.pgid));
          return {
            ...body,
            groups: [...current.groups, ...extra].sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
          };
        });
      })
      .catch(() => undefined);
  }, [filters.place]);

  useEffect(() => {
    if (!hover) {
      const timer = window.setTimeout(() => setHoverShown(null), 150);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setHoverShown(hover), 120);
    return () => window.clearTimeout(timer);
  }, [hover]);

  const listed = useMemo(() => applyFilters(catalog.groups, filters), [catalog.groups, filters]);
  const selectedGroup = listed.find((group) => group.pgid === selected) ?? catalog.groups.find((group) => group.pgid === selected) ?? null;
  const placeLabel = filters.place
    ? (US_STATES.find(([code]) => code === filters.place)?.[1] ?? filters.place)
    : (scope === "us" ? "the United States" : "this view");
  const resultLine = `${listed.length} group${listed.length === 1 ? "" : "s"} in ${placeLabel}`;

  const focus = useCallback((next: MapCommand) => {
    setHistory((current) => (command ? [...current, command] : current));
    setCommand(next);
    if (next.pgids[0]) setSelected(next.pgids[0]);
    setSheet((current) => (current === "peek" ? "half" : current));
    setBloom(true);
    window.setTimeout(() => setBloom(false), 650);
  }, [command]);

  function changeFilters(next: Filters) {
    setFilters(next);
    if (next.place && next.place !== filters.place) {
      const inPlace = applyFilters(catalog.groups, next);
      const name = US_STATES.find(([code]) => code === next.place)?.[1] ?? next.place;
      focus(commandFor(name, inPlace));
    }
  }

  function select(pgid: string | null) {
    setSelected(pgid);
    if (pgid) setSheet("half");
  }

  async function nearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const res = await fetch(`/api/near?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
      const body = (await res.json()) as { state?: string | null };
      if (body.state) {
        const next = { ...filters, place: body.state };
        setFilters(next);
        const inState = applyFilters(catalog.groups, next);
        const name = US_STATES.find(([code]) => code === body.state)?.[1] ?? body.state;
        focus(commandFor(name, inState));
      }
    });
  }

  return (
    <div className={ask ? "explore is-ask" : "explore"}>
      <SampleBanner
        label={catalog.mode === "sample" ? catalog.sampleLabel : null}
        attribution={catalog.attribution}
      />
      {catalog.mode === "live" ? (
        <div className="banner">
          <div className="shell">{catalog.attribution}</div>
        </div>
      ) : null}
      <FilterBar
        groups={catalog.groups}
        filters={filters}
        onChange={changeFilters}
        onClear={() => { setFilters(EMPTY_FILTERS); setMore(false); setCommand(null); }}
        onNearMe={() => void nearMe()}
        moreOpen={more}
        onMore={() => setMore((value) => !value)}
        resultLine={resultLine}
      />
      <div className="explore-body">
        <div className="atlas-wrap">
          <AtlasMap
            groups={listed}
            scope={scope}
            selectedPgid={selected}
            highlightedPgids={command?.pgids ?? []}
            command={command}
            bloom={bloom}
            onSelect={select}
            onHover={setHover}
            onScope={(next) => {
              setScope(next);
              setCommand(null);
            }}
          />
          {hoverShown ? (
            <div
              className="map-tooltip"
              style={{ left: hoverShown.x + 8, top: hoverShown.y + 8 }}
            >
              <strong>{hoverShown.group.name}</strong>
              {hoverShown.group.nativeName ? <p className="native">{hoverShown.group.nativeName}</p> : null}
              <p>{hoverShown.group.population?.toLocaleString("en-US")} · {hoverShown.group.languageName}</p>
              <MiniBand band={hoverShown.group.evangelicalBand} />
            </div>
          ) : null}
          {command ? (
            <button type="button" className="undo-chip" onClick={() => {
              const previous = history.at(-1) ?? null;
              setHistory((current) => current.slice(0, -1));
              setCommand(previous);
            }}>
              {command.label} · Back to previous view
            </button>
          ) : null}
        </div>
        <div className={`sheet is-${ask ? "full" : sheet}`}>
          <button type="button" className="grab" aria-label="Resize list" onClick={() => setSheet((current) => current === "peek" ? "half" : current === "half" ? "full" : "peek")} />
          <div className="sheet-head">
            <p className="nums">{resultLine}</p>
            <button type="button" className="btn secondary" onClick={() => setAsk((value) => !value)}>Ask</button>
          </div>
          {ask ? (
            <LibrarianPanel
              groups={listed.length ? listed : catalog.groups}
              attribution={catalog.attribution}
              demo={demo}
              onFocus={focus}
              onOpenGroup={(pgid) => { setAsk(false); select(pgid); setSheet("full"); }}
            />
          ) : selectedGroup && sheet === "full" ? (
            <GroupPanel group={selectedGroup} onAsk={() => setAsk(true)} />
          ) : (
            <ul className="sheet-list">
              {listed.map((group) => (
                <li key={group.pgid}>
                  <button
                    type="button"
                    className={group.pgid === selected ? "sheet-row is-on" : "sheet-row"}
                    aria-pressed={group.pgid === selected}
                    aria-label={`${group.name}. ${group.population?.toLocaleString("en-US") ?? "Population not listed"} · ${group.languageName ?? "language not listed"}. Evangelical band ${group.evangelicalBand ?? "not stated"}.`}
                    onClick={() => select(group.pgid)}
                    onMouseEnter={() => setHover({ group, x: 24, y: 24 })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <strong>{group.name}</strong>
                    <span>{group.country}{group.usStates.length ? ` · ${group.usStates.join(", ")}` : ""} · {group.population?.toLocaleString("en-US")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedGroup && sheet === "full" && !ask ? null : selectedGroup && !ask ? (
            <div className="sheet-peek-card">
              <GroupPanel group={selectedGroup} onAsk={() => setAsk(true)} />
            </div>
          ) : null}
        </div>
      </div>
      <SiteFooter attribution={catalog.attribution} />
    </div>
  );
}
