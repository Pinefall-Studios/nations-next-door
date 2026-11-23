import { describe, expect, it } from "vitest";
import {
  BANNED_CHAT_MARKERS,
  assertChatPayloadIsPublic,
  chatGetGroup,
  chatListByCountry,
  chatListByLanguage,
  chatListByUsState,
  chatShowOnMap,
} from "../src/core/chat-tools.js";
import { createPeopleGroupsService } from "../src/core/service.js";
import { stateForPoint } from "../src/core/state-geometry.js";
import { SENTINELS, jsonResponse, loadFixture, poison } from "./helpers.js";

const recorded = loadFixture<{ record: Record<string, unknown> }>("recorded-pg012345.json").record;
const usa = loadFixture<Record<string, unknown>[]>("usa-groups.json").map((group) => poison(group));

function fixtureFetch() {
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    const pgid = url.pathname.split("/").pop();
    if (pgid && pgid !== "people-groups") {
      if (pgid === "PG012345") return jsonResponse(poison({ ...recorded }));
      return jsonResponse({ code: "pg_not_found", message: "missing" }, { status: 404 });
    }
    if (url.searchParams.get("country") === "USA") {
      return jsonResponse(usa, { headers: { "X-WP-TotalPages": "1" } });
    }
    if (url.searchParams.get("country") === "BEN" || url.searchParams.get("language") === "ntm") {
      return jsonResponse([poison({ ...recorded })], { headers: { "X-WP-TotalPages": "1" } });
    }
    return jsonResponse([], { headers: { "X-WP-TotalPages": "1" } });
  };
  return createPeopleGroupsService({
    fetch: fetchImpl,
    baseUrl: "http://peoplegroups.test/v1",
    pageDelayMs: 0,
    cacheTtlMs: 1_000,
    now: () => 0,
  });
}

function assertPublic(payload: unknown) {
  const text = JSON.stringify(payload);
  for (const marker of BANNED_CHAT_MARKERS) {
    expect(text).not.toContain(marker);
  }
  for (const sentinel of SENTINELS) {
    expect(text).not.toContain(sentinel);
  }
}

describe("chat tools", () => {
  it("lists a country without GSEC, engagement, photos, or workers", async () => {
    const payload = await chatListByCountry(fixtureFetch(), { country: "Benin" });
    expect(payload.groups.length).toBeGreaterThan(0);
    expect(payload.groups[0]?.unreached).toBe(true);
    expect(payload.attribution).toMatch(/International Mission Board/);
    assertPublic(payload);
  });

  it("lists a US state without banned fields", async () => {
    const payload = await chatListByUsState(fixtureFetch(), { state: "Texas" });
    assertPublic(payload);
    for (const group of payload.groups) {
      expect(group.usStates).toContain("TX");
    }
  });

  it("lists a language without banned fields", async () => {
    const payload = await chatListByLanguage(fixtureFetch(), { language: "ntm" });
    expect(payload.groups[0]?.languageCode).toBe("ntm");
    assertPublic(payload);
  });

  it("returns one group without banned fields", async () => {
    const payload = await chatGetGroup(fixtureFetch(), { pgid: "PG012345" });
    expect(payload.group.pgid).toBe("PG012345");
    expect(payload.group.coordinatesRounded).toBeTypeOf("boolean");
    assertPublic(payload);
  });

  it("builds a map focus from a state query without banned fields", async () => {
    const payload = await chatShowOnMap(fixtureFetch(), { state: "TX" });
    expect(payload.map.label).toMatch(/TX|Texas/i);
    expect(payload.map.pgids.length).toBeGreaterThan(0);
    expect(payload.map.bounds).not.toBeNull();
    assertPublic(payload);
  });

  it("returns only groups whose points are in Texas, and count equals cards", async () => {
    const payload = await chatShowOnMap(fixtureFetch(), { state: "Texas" });
    expect(payload.groups.length).toBe(payload.map.pgids.length);
    expect(payload.groups.map((group) => group.pgid).sort()).toEqual(payload.map.pgids.slice().sort());
    expect(payload.groups.some((group) => group.pgid === "PG900002")).toBe(false);
    for (const group of payload.groups) {
      expect(group.usStates).toContain("TX");
      if (group.latitude !== null && group.longitude !== null) {
        expect(stateForPoint(group.latitude, group.longitude)).toBe("TX");
      }
    }
    expect(payload.map.stateCode).toBe("TX");
    const bounds = payload.map.bounds;
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    const [west, south, east, north] = bounds;
    expect(west).toBeGreaterThan(-110);
    expect(west).toBeLessThan(-103);
    expect(south).toBeGreaterThan(24);
    expect(south).toBeLessThan(27);
    expect(east).toBeGreaterThan(-95);
    expect(east).toBeLessThan(-92);
    expect(north).toBeGreaterThan(35.5);
    expect(north).toBeLessThan(37.5);
  });

  it("refuses a payload that still contains a banned field", () => {
    expect(() => assertChatPayloadIsPublic({ GSEC: "6" })).toThrow(/engagement or worker/i);
    expect(() => assertChatPayloadIsPublic({ FieldWorkers: 3 })).toThrow(/engagement or worker/i);
  });
});
