import { describe, expect, it } from "vitest";
import { IMB_ATTRIBUTION } from "../src/core/attribution.js";
import { createPeopleGroupsService } from "../src/core/service.js";
import {
  handleGetPeopleGroup,
  handleListUnreachedByCountry,
  SERVER_INSTRUCTIONS,
} from "../src/mcp/tools.js";
import { createServer } from "../src/server.js";
import { jsonResponse, loadFixture } from "./helpers.js";

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
    const service = createPeopleGroupsService({
      fetch: async () => jsonResponse(recorded),
      baseUrl: "http://peoplegroups.test/v1",
      pageDelayMs: 0,
      cacheTtlMs: 0,
    });
    const result = await handleGetPeopleGroup(service, { pgid: "PG012345" });
    expect(result.isError).toBeUndefined();
    const text = textOf(result);
    expect(text.startsWith(IMB_ATTRIBUTION)).toBe(true);
    expect(text).toContain("Nateni");
    expect(text).not.toContain("SENTINEL_FIELD_WORKERS");
    expect(text).not.toContain("SENTINEL_ENGAGEMENT_STATUS");
    expect(text).not.toContain("LocationDescription");
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

    const leaking = {
      async listUnreachedByCountry() {
        throw new Error("database password hunter2");
      },
      async listUnreachedByUsState() {
        throw new Error("unused");
      },
      async getPeopleGroup() {
        throw new Error("unused");
      },
      async listPeopleGroupsByLanguage() {
        throw new Error("unused");
      },
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
