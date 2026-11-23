"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Catalog, ViewGroup } from "../lib/view";
import type { MapCommand } from "../lib/map-command";
import { commandFor } from "../lib/map-command";
import { US_STATES } from "../lib/us-states";
import { applyFilters, EMPTY_FILTERS, type Filters } from "../lib/filters";
import { FilterBar } from "./FilterBar";
import { GroupPanel } from "./GroupPanel";
import { LibrarianPanel } from "./LibrarianPanel";
import { MiniBand } from "./MiniBand";
import { SiteFooter, SourceBanner } from "./SiteChrome";

const AtlasMap = dynamic(() => import("./AtlasMap").then((mod) => mod.AtlasMap), { ssr: false });

type HoverInfo = { group: ViewGroup; x: number; y: number };

function tooltipPosition(info: HoverInfo): { left: number; top: number } {
  const left = Math.max(220, Math.min(info.x + 12, typeof window === "undefined" ? info.x : window.innerWidth - 220));
  const top = info.y < 72 ? info.y + 18 : Math.max(12, info.y - 12);
  return { left, top };
}

export function Explore({ initial }: { initial: Catalog }) {
  const [catalog, setCatalog] = useState(initial);
  const [pending, setPending] = useState(initial.mode !== "live");
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
  const listRef = useRef<HTMLUListElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    fetch("/api/chat").then((res) => res.json()).then((body) => setDemo(Boolean(body.demo))).catch(() => setDemo(true));
    fetch("/api/groups?country=USA&unreached=no")
      .then((res) => res.json())
      .then((body: Catalog) => {
        if (body.groups?.length) setCatalog(body);
      })
      .catch(() => undefined)
      .finally(() => setPending(false));
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
  const peekLine = listed[0]
    ? `${listed.length} group${listed.length === 1 ? "" : "s"} · ${listed[0].name}`
    : resultLine;

  useEffect(() => {
    if (!selected || ask) return;
    const row = listRef.current?.querySelector(`[data-pgid="${selected}"]`);
    row?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [selected, sheet, ask]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
    sheetRef.current?.scrollTo({ top: 0 });
  }, [scope, filters]);

  useEffect(() => {
    const node = sheetRef.current;
    if (!node) return;
    const measure = () => setSheetHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ask, sheet]);

  const focus = useCallback((next: MapCommand) => {
    setHistory((current) => (command ? [...current, command] : current));
    setCommand(next);
    if (next.pgids[0]) setSelected(next.pgids[0]);
    setSheet((current) => (current === "full" ? "half" : current === "peek" ? "half" : current));
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
    if (!pgid) {
      setSelected(null);
      return;
    }
    const mobile = window.matchMedia("(max-width: 959px)").matches;
    if (mobile && pgid === selected && sheet !== "full") {
      setSheet("full");
      return;
    }
    setSelected(pgid);
    if (mobile) setSheet((current) => (current === "full" ? "full" : "half"));
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

  const tip = hoverShown ? tooltipPosition(hoverShown) : null;

  const showCard = Boolean(selectedGroup && sheet === "full" && !ask);

  return (
    <div className={`explore${ask ? " is-ask" : ""}${showCard ? " is-full-card" : ""}`}>
      {pending ? (
        <div className="banner is-slim" data-testid="data-loading">
          <div className="shell">Loading people groups…</div>
        </div>
      ) : (
        <SourceBanner attribution={catalog.attribution} sample={catalog.mode === "sample"} />
      )}
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
            insetBottom={sheetHeight}
            onSelect={select}
            onHover={setHover}
            onScope={(next) => {
              setScope(next);
              setCommand(null);
            }}
          />
          {hoverShown && tip ? (
            <div className="map-tooltip" style={{ left: tip.left, top: tip.top }}>
              <strong>{hoverShown.group.name}</strong>
              {hoverShown.group.nativeName ? <p className="native">{hoverShown.group.nativeName}</p> : null}
              <p>{hoverShown.group.population?.toLocaleString("en-US")} · {hoverShown.group.languageName}</p>
              <MiniBand band={hoverShown.group.evangelicalBand} />
            </div>
          ) : null}
          {scope === "world" ? (
            <p className="world-note">This view currently covers groups in the United States.</p>
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
          {selectedGroup && !ask ? (
            <aside className="group-dock" aria-label={`${selectedGroup.name} detail`}>
              <div className="group-dock-head">
                <p className="gold">People group</p>
                <button type="button" className="quiet-btn" onClick={() => setSelected(null)}>Close</button>
              </div>
              <GroupPanel
                group={selectedGroup}
                onAsk={() => setAsk(true)}
              />
            </aside>
          ) : null}
        </div>
        <div ref={sheetRef} className={`sheet is-${ask ? "ask" : sheet}`}>
          <div className="sheet-chrome">
          <button type="button" className="grab" aria-label="Resize list" onClick={() => setSheet((current) => current === "peek" ? "half" : current === "half" ? "full" : "peek")} />
          <div className="sheet-head">
            {showCard && selectedGroup ? (
              <button type="button" className="btn secondary" onClick={() => setSheet("half")}>Back</button>
            ) : (
              <>
                <p className="nums">{sheet === "peek" && !ask ? peekLine : resultLine}</p>
                {ask ? (
                  <button type="button" className="btn secondary" onClick={() => setAsk(false)}>Close</button>
                ) : (
                  <button type="button" className="btn secondary" onClick={() => setAsk(true)}>Ask</button>
                )}
              </>
            )}
          </div>
          </div>
          {ask ? (
            <LibrarianPanel
              groups={listed.length ? listed : catalog.groups}
              attribution={catalog.attribution}
              demo={demo}
              onFocus={focus}
              onClose={() => setAsk(false)}
              onOpenGroup={(pgid) => { setAsk(false); select(pgid); setSheet("full"); }}
            />
          ) : showCard && selectedGroup ? (
            <>
              <div className="sheet-card">
                <GroupPanel
                  group={selectedGroup}
                  onAsk={() => setAsk(true)}
                  onClose={() => setSheet("half")}
                />
              </div>
              <div className="sheet-footer">
                <a className="btn" href={`/groups/${selectedGroup.pgid}#pray`}>Pray</a>
                <button type="button" className="btn secondary" onClick={() => setAsk(true)}>Ask</button>
              </div>
            </>
          ) : (
            <ul className="sheet-list" ref={listRef}>
              {listed.map((group) => (
                <li key={group.pgid} data-pgid={group.pgid}>
                  <button
                    type="button"
                    className={group.pgid === selected ? "sheet-row is-on" : "sheet-row"}
                    aria-pressed={group.pgid === selected}
                    aria-label={`${group.name}. ${group.population?.toLocaleString("en-US") ?? "Population not listed"} · ${group.languageName ?? "language not listed"}. Evangelical band ${group.evangelicalBand ?? "not stated"}.`}
                    onClick={() => select(group.pgid)}
                    onMouseEnter={() => {
                      if (window.matchMedia("(pointer: coarse)").matches) return;
                      setHover({ group, x: 240, y: 88 });
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <strong>{group.name}</strong>
                    <span>{group.country}{group.usStates.length ? ` · ${group.usStates.join(", ")}` : ""} · {group.population?.toLocaleString("en-US")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <SiteFooter attribution={catalog.attribution} />
    </div>
  );
}
