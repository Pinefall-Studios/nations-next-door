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
