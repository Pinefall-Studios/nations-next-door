import { describe, expect, it } from "vitest";
import { IMB_ATTRIBUTION } from "../src/core/attribution.js";
import { PeopleGroupNotFoundError, QueryTooBroadError, UnknownPlaceError } from "../src/core/errors.js";
import { createPeopleGroupsService } from "../src/core/service.js";
import { SENTINELS, jsonResponse, loadFixture, poison } from "./helpers.js";

const recorded = loadFixture<{ record: Record<string, unknown> }>("recorded-pg012345.json").record;
const usa = loadFixture<Record<string, unknown>[]>("usa-groups.json").map((group) => poison(group));
const reachedBenin = poison({
  PGID: "PG900099",
  DisplayName: "Reached Benin Group",
  ISOAlpha3: "BEN",
  CountryName: "Benin",
  Population: 10,
  EvangelicalLevel: "5% or Greater but Less than 10%",
  GSEC: 5,
  LanguageName: "French",
  LanguageCode: "fra",
  ReligionName: "Christianity",
  Lat: 6.5,
  Long: 2.4,
});

function fixtureFetch() {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    const pgid = url.pathname.split("/").pop();
    if (pgid && pgid !== "people-groups") {
      if (pgid === "PG012345") return jsonResponse(recorded);
      return jsonResponse({ code: "pg_not_found", message: "missing" }, { status: 404 });
    }
    const page = Number(url.searchParams.get("page") ?? "1");
    if (url.searchParams.get("country") === "USA") {
      const mid = Math.ceil(usa.length / 2);
      const slice = page === 1 ? usa.slice(0, mid) : usa.slice(mid);
      return jsonResponse(slice, { headers: { "X-WP-TotalPages": "2" } });
    }
    if (url.searchParams.get("country") === "BEN" || url.searchParams.get("language") === "ntm") {
      const rows = url.searchParams.get("language") === "ntm" ? [recorded] : [recorded, reachedBenin];
      return jsonResponse(rows, { headers: { "X-WP-TotalPages": "1" } });
    }
    if (url.searchParams.get("country") === "TGO") {
      return jsonResponse([recorded], { headers: { "X-WP-TotalPages": "21" } });
    }
    return jsonResponse([], { headers: { "X-WP-TotalPages": "1" } });
  };
  return { fetchImpl, calls };
}

function serviceWith(clock?: { now: number }) {
  const { fetchImpl, calls } = fixtureFetch();
  const service = createPeopleGroupsService({
    fetch: fetchImpl,
    baseUrl: "http://peoplegroups.test/v1",
    pageDelayMs: 0,
    cacheTtlMs: 1_000,
    now: () => clock?.now ?? 0,
  });
  return { service, calls, clock };
}

describe("PeopleGroups service", () => {
  it("lists unreached groups in a country and drops engagement fields", async () => {
    const { service, calls } = serviceWith();
    const result = await service.listUnreachedByCountry({ country: "Benin" });
    expect(result.total).toBe(1);
    expect(result.groups.map((group) => group.pgid)).toEqual(["PG012345"]);
    expect(result.attribution).toBe(IMB_ATTRIBUTION);
    expect(result.sources[0]?.id).toBe("imb-peoplegroups");
    expect(calls.some((url) => url.includes("country=BEN"))).toBe(true);
    expect(calls.some((url) => url.includes("engagement=") || url.includes("/export"))).toBe(false);
    const text = JSON.stringify(result);
    for (const sentinel of SENTINELS) expect(text).not.toContain(sentinel);
  });

  it("asks for alpha-3 codes, including aliases the API does not spell in English", async () => {
    const { service, calls } = serviceWith();
    await service.listUnreachedByCountry({ country: "United States", limit: 1 });
    await service.listUnreachedByCountry({ country: "Turkey", limit: 1 });
    await service.listUnreachedByCountry({ country: "GA", limit: 1 });
    expect(calls.some((url) => url.includes("country=USA"))).toBe(true);
    expect(calls.some((url) => url.includes("country=TUR"))).toBe(true);
    expect(calls.some((url) => url.includes("country=GAB"))).toBe(true);
    await expect(service.listUnreachedByCountry({ country: "Korea" })).rejects.toBeInstanceOf(
      UnknownPlaceError,
    );
  });

  it("assigns US states from points and location names, and caches the US download", async () => {
    const { service, calls } = serviceWith();
    const texas = await service.listUnreachedByUsState({ state: "Texas", limit: 10 });
    expect(texas.groups.map((group) => group.pgid)).toEqual([
      "PG900001",
      "PG900002",
      "PG900003",
      "PG900004",
    ]);
    expect(texas.groups.find((group) => group.pgid === "PG900002")?.usStates).toEqual(["LA", "TX"]);
    expect(texas.geographyNote).toMatch(/Census Bureau/);
    expect(JSON.stringify(texas)).not.toContain("SENTINEL_LOCATION_TEXT");

    const firstPages = calls.filter((url) => url.includes("country=USA")).length;
    expect(firstPages).toBe(2);

    const westVirginia = await service.listUnreachedByUsState({ state: "WV" });
    expect(westVirginia.groups.map((group) => group.name)).toEqual(["West Virginia Group"]);
    expect(westVirginia.groups[0]?.usStates).toEqual(["WV"]);
    const virginia = await service.listUnreachedByUsState({ state: "Virginia" });
    expect(virginia.groups.map((group) => group.pgid)).not.toContain("PG900006");

    const district = await service.listUnreachedByUsState({ state: "Washington, D.C." });
    expect(district.groups.map((group) => group.pgid)).toEqual(["PG900007"]);
    const washington = await service.listUnreachedByUsState({ state: "Washington" });
    expect(washington.groups.map((group) => group.pgid)).toEqual(["PG900008"]);

    const oklahoma = await service.listUnreachedByUsState({ state: "Oklahoma" });
    expect(oklahoma.groups.map((group) => group.pgid)).toEqual(["PG900009"]);

    expect(calls.filter((url) => url.includes("country=USA")).length).toBe(firstPages);
  });

  it("pages with limit and offset after sorting by population", async () => {
    const { service } = serviceWith();
    const page = await service.listUnreachedByUsState({ state: "TX", limit: 1, offset: 1 });
    expect(page.total).toBe(4);
    expect(page.groups.map((group) => group.pgid)).toEqual(["PG900002"]);
  });

  it("refetches after the cache lifetime", async () => {
    const clock = { now: 0 };
    const { service, calls } = serviceWith(clock);
    await service.listUnreachedByCountry({ country: "Benin", limit: 1 });
    const afterFirst = calls.length;
    clock.now = 500;
    await service.listUnreachedByCountry({ country: "Benin", limit: 1 });
    expect(calls.length).toBe(afterFirst);
    clock.now = 1_000;
    await service.listUnreachedByCountry({ country: "Benin", limit: 1 });
    expect(calls.length).toBeGreaterThan(afterFirst);
  });

  it("gets one group and reports a missing id", async () => {
    const { service, calls } = serviceWith();
    const details = await service.getPeopleGroup({ pgid: "pg012345" });
    expect(details.group.name).toBe("Nateni");
    expect(details.group.reachedStatus).toBe("unreached");
    expect(JSON.stringify(details)).not.toContain("SENTINEL_FIELD_WORKERS");
    expect(calls[0]).toContain("/people-groups/PG012345");
    await expect(service.getPeopleGroup({ pgid: "PG999999" })).rejects.toBeInstanceOf(
      PeopleGroupNotFoundError,
    );
    await expect(service.getPeopleGroup({ pgid: "PG12" })).rejects.toThrow(/PG012345/);
  });

  it("lists groups by ISO 639-3 code", async () => {
    const { service, calls } = serviceWith();
    const result = await service.listPeopleGroupsByLanguage({ language: "NTM" });
    expect(result.groups.map((group) => group.pgid)).toEqual(["PG012345"]);
    expect(calls.some((url) => url.includes("language=ntm"))).toBe(true);
    const unreached = await service.listPeopleGroupsByLanguage({
      language: "ntm",
      country: "Benin",
      unreachedOnly: true,
    });
    expect(unreached.total).toBe(1);
    await expect(service.listPeopleGroupsByLanguage({ language: "en" })).rejects.toThrow(/three-letter/);
  });

  it("stops when a query would page through too much of the dataset", async () => {
    const { service } = serviceWith();
    await expect(service.listUnreachedByCountry({ country: "Togo" })).rejects.toBeInstanceOf(
      QueryTooBroadError,
    );
  });
});
