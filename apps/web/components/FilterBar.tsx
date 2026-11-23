"use client";

import { shortBand } from "../lib/band";
import { type Filters } from "../lib/filters";
import { US_STATES } from "../lib/us-states";
import type { ViewGroup } from "../lib/view";

export { applyFilters, EMPTY_FILTERS, type Filters } from "../lib/filters";

export function FilterBar({
  groups,
  filters,
  onChange,
  onClear,
  onNearMe,
  moreOpen,
  onMore,
  resultLine,
}: {
  groups: ViewGroup[];
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  onNearMe: () => void;
  moreOpen: boolean;
  onMore: () => void;
  resultLine: string;
}) {
  const languages = [...new Map(
    groups
      .filter((group) => group.languageCode)
      .map((group) => [group.languageCode as string, group.languageName ?? group.languageCode as string]),
  ).entries()];
  const religions = [...new Set(groups.map((group) => group.religion).filter(Boolean))] as string[];
  const bands = [...new Set(groups.map((group) => group.evangelicalBand).filter(Boolean))] as string[];
  const countries = [...new Set(groups.map((group) => group.country).filter(Boolean))] as string[];

  return (
    <div className="filter-bar">
      <div className="chip-row">
        <button
          type="button"
          className={filters.unreachedOnly ? "chip-filter is-on" : "chip-filter"}
          onClick={() => onChange({ ...filters, unreachedOnly: !filters.unreachedOnly })}
        >
          Unreached only
        </button>
        <label className={filters.language ? "chip-filter is-on" : "chip-filter"}>
          Language
          <select value={filters.language} onChange={(event) => onChange({ ...filters, language: event.target.value })}>
            <option value="">Any</option>
            {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <label className={filters.religion ? "chip-filter is-on" : "chip-filter"}>
          Religion
          <select value={filters.religion} onChange={(event) => onChange({ ...filters, religion: event.target.value })}>
            <option value="">Any</option>
            {religions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <button
          type="button"
          className={filters.scripture ? "chip-filter is-on" : "chip-filter"}
          onClick={() => onChange({ ...filters, scripture: !filters.scripture })}
        >
          Scripture available
        </button>
        <label className={filters.place ? "chip-filter is-on place" : "chip-filter place"}>
          Place
          <select value={filters.place} onChange={(event) => onChange({ ...filters, place: event.target.value })}>
            <option value="">Anywhere</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            {countries.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="chip-filter">
          Sort
          <select
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value === "largest" ? "largest" : "reach" })}
          >
            <option value="reach">Least reached</option>
            <option value="largest">Largest</option>
          </select>
        </label>
        <button type="button" className="chip-filter more" onClick={onMore}>More filters</button>
      </div>
      <div className="filter-meta">
        <p className="nums">{resultLine}</p>
        <button type="button" className="quiet-btn" onClick={onClear}>Clear</button>
        <button type="button" className="quiet-btn" onClick={onNearMe}>Near me</button>
      </div>
      {moreOpen ? (
        <div
          className="more-filters"
          role="dialog"
          aria-modal="true"
          aria-label="More filters"
          onClick={(event) => {
            if (event.target === event.currentTarget) onMore();
          }}
        >
          <div className="more-filters-panel">
            <div className="more-filters-head">
              <h2>More filters</h2>
              <button type="button" className="btn secondary" onClick={onMore}>Done</button>
            </div>
            <label>
              <span>Evangelical band</span>
              <select value={filters.band} onChange={(event) => onChange({ ...filters, band: event.target.value })}>
                <option value="">Any</option>
                {bands.map((item) => <option key={item} value={item}>{shortBand(item)}</option>)}
              </select>
            </label>
            <label>
              <span>Population from</span>
              <input type="text" inputMode="numeric" value={filters.popMin} onChange={(event) => onChange({ ...filters, popMin: event.target.value })} />
            </label>
            <label>
              <span>Population to</span>
              <input type="text" inputMode="numeric" value={filters.popMax} onChange={(event) => onChange({ ...filters, popMax: event.target.value })} />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
