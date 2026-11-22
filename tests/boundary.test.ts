import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

function typescriptFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) files.push(...typescriptFiles(full));
    else if (full.endsWith(".ts")) files.push(full);
  }
  return files;
}

const FORBIDDEN_FIXTURE_KEYS = [
  "GSEC",
  "GSECDescription",
  "GSECLongDescription",
  "GSECbrf",
  "GSEClng",
  "EngStat",
  "EngagementStatus",
  "EngagementProgress",
  "EngagementProgressDesc",
  "SPI",
  "SPIdesc",
  "CongExst",
  "CongregationsExist",
  "Plnting",
  "ChurchPlantingWithinLast2Years",
  "LocationDesc",
  "LocationDescription",
  "PicURL",
  "PhotoURL",
  "PhotoCredit",
  "FieldWorkers",
  "Missionaries",
  "LocalBelievers",
  "SecurityLevel",
];

function keysOf(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) keysOf(item, found);
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      found.add(key);
      keysOf(child, found);
    }
  }
}

describe("fixtures", () => {
  it("does not store engagement, GSEC, photos, or location narratives", () => {
    const directory = path.join(root, "tests/fixtures");
    const files = readdirSync(directory).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const found = new Set<string>();
      keysOf(JSON.parse(readFileSync(path.join(directory, name), "utf8")), found);
      for (const key of FORBIDDEN_FIXTURE_KEYS) {
        expect(found, `${name} contains ${key}`).not.toContain(key);
      }
    }
  });
});

describe("core library boundary", () => {
  it("keeps the MCP SDK out of the data layer", () => {
    const files = typescriptFiles(path.join(root, "src/core"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain("@modelcontextprotocol");
      expect(source, file).not.toContain("../server");
      expect(source, file).not.toContain("../mcp");
    }
  });

  it("keeps HTTP calls out of the tool wrapper", () => {
    const source = readFileSync(path.join(root, "src/mcp/tools.ts"), "utf8");
    expect(source).not.toContain("peoplegroups.org");
    expect(source).not.toContain("fetch(");
    const server = readFileSync(path.join(root, "src/server.ts"), "utf8");
    expect(server).toContain("createPeopleGroupsService");
    expect(server).not.toContain("fetch(");
  });
});
