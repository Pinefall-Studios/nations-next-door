"use client";

import { useMemo, useState } from "react";
import { GroupList } from "./GroupList";
import type { ViewGroup } from "../lib/view";

const STATES = ["", "TX", "LA", "MS"];

const PLACE: Record<string, { country?: string; state?: string }> = {
  Texas: { state: "TX" },
  Louisiana: { state: "LA" },
  Benin: { country: "Benin" },
  Afghanistan: { country: "Afghanistan" },
  Guatemala: { country: "Guatemala" },
  Andorra: { country: "Andorra" },
};

export function SearchBoard({ groups, place = "" }: { groups: ViewGroup[]; place?: string }) {
  const preset = PLACE[place] ?? {};
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(preset.country ?? "");
  const [state, setState] = useState(preset.state ?? "");
  const [religion, setReligion] = useState("");
  const [unreached, setUnreached] = useState("");
  const [band, setBand] = useState("");
  const [scripture, setScripture] = useState("");

  const religions = [...new Set(groups.map((group) => group.religion).filter(Boolean))] as string[];
  const bands = [...new Set(groups.map((group) => group.evangelicalBand).filter(Boolean))] as string[];
  const countries = [...new Set(groups.map((group) => group.country).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (needle) {
        const hay = `${group.name} ${group.nativeName ?? ""} ${group.languageName ?? ""} ${group.languageCode ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (country && group.country !== country) return false;
      if (state && !group.usStates.includes(state)) return false;
      if (religion && group.religion !== religion) return false;
      if (unreached === "yes" && group.unreached !== true) return false;
      if (unreached === "no" && group.unreached !== false) return false;
      if (band && group.evangelicalBand !== band) return false;
      if (scripture === "bible" && group.bible !== "Available") return false;
      return true;
    });
  }, [groups, query, country, state, religion, unreached, band, scripture]);

  return (
    <>
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>Name or language</span>
          <input type="search" value={query} placeholder="Kannada, Fon, quc" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Country</span>
          <select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="">Any</option>
            {countries.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>US state</span>
          <select value={state} onChange={(event) => setState(event.target.value)}>
            {STATES.map((item) => <option key={item || "any"} value={item}>{item || "Any"}</option>)}
          </select>
        </label>
        <label>
          <span>Religion</span>
          <select value={religion} onChange={(event) => setReligion(event.target.value)}>
            <option value="">Any</option>
            {religions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Unreached</span>
          <select value={unreached} onChange={(event) => setUnreached(event.target.value)}>
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          <span>Evangelical band</span>
          <select value={band} onChange={(event) => setBand(event.target.value)}>
            <option value="">Any</option>
            {bands.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Scripture</span>
          <select value={scripture} onChange={(event) => setScripture(event.target.value)}>
            <option value="">Any</option>
            <option value="bible">Bible noted available</option>
          </select>
        </label>
      </form>
      <p className="quiet nums">{filtered.length} groups</p>
      <GroupList groups={filtered} />
    </>
  );
}
