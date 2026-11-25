import { describe, expect, it } from "vitest";
import { imbAttribution } from "../src/core/attribution.js";
import { createPeopleGroupsService } from "../src/core/service.js";
import {
  handleGetPeopleGroup,
  handleListUnreachedByCountry,
  SERVER_INSTRUCTIONS,
} from "../src/mcp/tools.js";
import { createServer } from "../src/server.js";
import { SENTINELS, jsonResponse, loadFixture, poison } from "./helpers.js";

const recorded = loadFixture<{ record: Record<string, unknown> }>("recorded-pg012345.json").record;

function textOf(result: { content: ReadonlyArray<{ type: string }> }): string {
  const block = result.content[0];
  if (!block || !("text" in block) || typeof block.text !== "string") {
    throw new Error("expected a text block");
  }
  return block.text;
}

describe("MCP tool handlers", () => {
  it("returns IMB attribution and the public record, with no engagement payload", async () => {
    const when = new Date("2026-11-22T12:00:00Z");
    const service = createPeopleGroupsService({
      fetch: async () => jsonResponse(poison({ ...recorded, LocationDescription: "SENTINEL_LOCATION_TEXT" })),
      baseUrl: "http://peoplegroups.test/v1",
      pageDelayMs: 0,
      cacheTtlMs: 0,
      now: () => when.getTime(),
    });
    const result = await handleGetPeopleGroup(service, { pgid: "PG012345" });
    expect(result.isError).toBeUndefined();
    const text = textOf(result);
    expect(text.startsWith(imbAttribution(when))).toBe(true);
    expect(text).toContain("Nateni");
    expect(text).toContain('"unreached": true');
    for (const sentinel of SENTINELS) expect(text).not.toContain(sentinel);
    expect(text).not.toMatch(/GSEC|EngStat|SPIdesc|CongExst|Plnting|GSEClng|LocationDesc|PicURL|PhotoURL/);
  });

  it("turns a known data error into a tool error and hides unexpected error text", async () => {
    const service = createPeopleGroupsService({
      fetch: async () => jsonResponse([]),
      baseUrl: "http://peoplegroups.test/v1",
      pageDelayMs: 0,
    });
    const unknown = await handleListUnreachedByCountry(service, { country: "Atlantis" });
    expect(unknown.isError).toBe(true);
    expect(textOf(unknown)).toMatch(/No country match/);

    const unused = async () => {
      throw new Error("unused");
    };
    const leaking = {
      async listUnreachedByCountry() {
        throw new Error("database password hunter2");
      },
      listUnreachedByUsState: unused,
      listPeopleGroupsByCountry: unused,
      listPeopleGroupsByUsState: unused,
      loadCountry: unused,
      getPeopleGroup: unused,
      listPeopleGroupsByLanguage: unused,
      clearCache() {},
    };
    const hidden = await handleListUnreachedByCountry(leaking, { country: "India" });
    expect(hidden.isError).toBe(true);
    expect(textOf(hidden)).not.toContain("hunter2");
  });

  it("builds a server whose instructions forbid worker and believer data", () => {
    const service = createPeopleGroupsService({
      fetch: async () => jsonResponse([]),
      pageDelayMs: 0,
    });
    const server = createServer(service);
    expect(server).toBeDefined();
    expect(SERVER_INSTRUCTIONS).toMatch(/field workers/i);
    expect(SERVER_INSTRUCTIONS).toMatch(/local believers/i);
    expect(SERVER_INSTRUCTIONS).toMatch(/will not infer/i);
  });
});
