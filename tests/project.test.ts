import { describe, expect, it } from "vitest";
import { reachedStatus, toPublicPeopleGroup } from "../src/core/project.js";
import { SENTINELS, loadFixture } from "./helpers.js";

const recorded = loadFixture<{ record: Record<string, unknown> }>("recorded-pg012345.json").record;
const shortNames = loadFixture<Record<string, unknown>>("short-names.json");

function serialized(group: unknown): string {
  return JSON.stringify(group);
}

describe("toPublicPeopleGroup", () => {
  it("keeps public aggregate fields from a recorded PeopleGroups.org record", () => {
    const group = toPublicPeopleGroup(recorded);
    expect(group).toMatchObject({
      pgid: "PG012345",
      peid: 12345,
      name: "Nateni",
      country: "Benin",
      countryCode: "BEN",
      region: "Africa",
      subregion: "Western Africa",
      population: 135000,
      latitude: 10.52,
      longitude: 1.22,
      usStates: [],
      primaryLanguage: { name: "Nateni", code: "ntm", family: "Atlantic-Congo" },
      religion: { name: "Ethnoreligion - Animism", code: "EAN" },
      evangelicalLevel: "Less than 2%",
      reachedStatus: "unreached",
      gsec: 1,
      lostness: "Pioneer Unreached People Group",
      populationContext: "indigenous",
      summary: expect.stringContaining("northwestern Benin"),
      scriptureAvailability: { bible: "Available", jesusFilm: "Not Available", resourceTotal: 3 },
      dataDate: "2026-11-21",
    });
  });

  it("strips engagement, worker, believer, photo, and location fields", () => {
    const group = toPublicPeopleGroup(recorded);
    const text = serialized(group);
    for (const sentinel of SENTINELS) {
      expect(text).not.toContain(sentinel);
    }
    expect(text).not.toContain("SENTINEL_RELIGION_ESSAY");
    expect(text).not.toContain("church planting");
    const keys = JSON.stringify(Object.keys(group ?? {}));
    expect(keys).not.toMatch(/engagement|worker|missionar|believer|congregation|photo|location/i);
  });

  it("does not treat a location mention as a US state outside the United States", () => {
    const group = toPublicPeopleGroup(recorded);
    expect(group?.usStates).toEqual([]);
  });

  it("reads the documented short field names and still strips engagement", () => {
    const group = toPublicPeopleGroup(shortNames);
    expect(group).toMatchObject({
      pgid: "PG000111",
      name: "Short Name Group",
      alternateNames: "Alternate",
      country: "Benin",
      countryCode: "BEN",
      population: 1000,
      primaryLanguage: { name: "Example", code: "aaa", family: "Example Family" },
      religion: { name: "Islam", code: "ISN" },
      reachedStatus: "reached",
      gsec: 4,
      scriptureAvailability: { bible: "Available", resourceTotal: 1 },
    });
    const text = serialized(group);
    for (const sentinel of SENTINELS) expect(text).not.toContain(sentinel);
  });

  it("drops a summary that talks about workers or believers", () => {
    const group = toPublicPeopleGroup({
      ...recorded,
      Description: "Field workers and local believers meet in this community.",
    });
    expect(group?.summary).toBeNull();
    expect(serialized(group)).not.toContain("Field workers");
  });

  it("returns null when there is no people-group id", () => {
    expect(toPublicPeopleGroup({ DisplayName: "Nameless" })).toBeNull();
    expect(toPublicPeopleGroup([])).toBeNull();
  });
});

describe("reachedStatus", () => {
  it("uses the evangelical band, then GSEC 0-3", () => {
    expect(reachedStatus("Less than 2%", 5)).toBe("unreached");
    expect(reachedStatus("5% or Greater but Less than 10%", 1)).toBe("reached");
    expect(reachedStatus(null, 0)).toBe("unreached");
    expect(reachedStatus(null, 3)).toBe("unreached");
    expect(reachedStatus(null, 4)).toBe("reached");
    expect(reachedStatus(null, null)).toBe("unknown");
  });
});
