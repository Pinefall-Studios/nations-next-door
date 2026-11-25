import { describe, expect, it } from "vitest";
import { evangelicalBandDepth, evangelicalFloorPercent, toPublicPeopleGroup, unreachedFromBand } from "../src/core/project.js";
import { SENTINELS, loadFixture, poison } from "./helpers.js";

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
      coordinatesRounded: false,
      usStates: [],
      primaryLanguage: { name: "Nateni", code: "ntm", family: "Atlantic-Congo" },
      religion: { name: "Ethnoreligion - Animism", code: "EAN" },
      unreached: true,
      evangelicalBand: "Less than 2%",
      populationContext: "indigenous",
      summary: expect.stringContaining("northwestern Benin"),
      scriptureAvailability: { bible: "Available", jesusFilm: "Not Available", resourceTotal: 3 },
      dataDate: "2026-11-21",
    });
  });

  it("strips engagement, worker, believer, photo, and location fields", () => {
    const group = toPublicPeopleGroup(
      poison({ ...recorded, LocationDescription: "SENTINEL_LOCATION_TEXT" }),
    );
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
    const group = toPublicPeopleGroup(
      poison({ ...shortNames, LocationDesc: "SENTINEL_LOCATION_TEXT" }),
    );
    expect(group).toMatchObject({
      pgid: "PG000111",
      name: "Short Name Group",
      alternateNames: "Alternate",
      country: "Benin",
      countryCode: "BEN",
      population: 1000,
      primaryLanguage: { name: "Example", code: "aaa", family: "Example Family" },
      religion: { name: "Islam", code: "ISN" },
      unreached: false,
      evangelicalBand: "2% or Greater but Less than 5%",
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

describe("unreachedFromBand", () => {
  it("treats less than 2% as unreached and does not match less than 20%", () => {
    expect(unreachedFromBand("Less than 2%")).toBe(true);
    expect(unreachedFromBand("Less than 2% evangelical")).toBe(true);
    expect(unreachedFromBand("<2%")).toBe(true);
    expect(unreachedFromBand("Less than 20%")).toBe(false);
    expect(unreachedFromBand("Less than 20% evangelical")).toBe(false);
    expect(unreachedFromBand("2% or Greater but Less than 20%")).toBe(false);
    expect(unreachedFromBand("15% or Greater but Less than 20%")).toBe(false);
    expect(unreachedFromBand("2% or Greater but Less than 5%")).toBe(false);
    expect(unreachedFromBand("5% or Greater but Less than 10%")).toBe(false);
    expect(unreachedFromBand("5.0% evangelical")).toBe(false);
  });

  it("applies Unreached only to a list and sorts deepest band, then population", () => {
    const groups = [
      { name: "African Americans", evangelicalBand: "15% or Greater but Less than 20%", population: 40_600_000 },
      { name: "French Canadians", evangelicalBand: "2% or Greater but Less than 20%", population: 2_000_000 },
      { name: "French", evangelicalBand: "Less than 20% evangelical", population: 1_200_000 },
      { name: "Dutch", evangelicalBand: "Less than 20%", population: 900_000 },
      { name: "Czechs", evangelicalBand: "5% or Greater but Less than 10%", population: 700_000 },
      { name: "Somali", evangelicalBand: "Less than 2%", population: 80_000 },
      { name: "Yazidi", evangelicalBand: "Less than 2% evangelical", population: 12_000 },
    ];
    const listed = groups
      .filter((group) => unreachedFromBand(group.evangelicalBand) === true)
      .sort((a, b) => {
        const deep = evangelicalBandDepth(b.evangelicalBand) - evangelicalBandDepth(a.evangelicalBand);
        if (deep !== 0) return deep;
        return b.population - a.population;
      });
    expect(listed.map((group) => group.name)).toEqual(["Somali", "Yazidi"]);
  });

  it("reads a numeric floor from a public evangelical band when one exists", () => {
    expect(evangelicalFloorPercent("Less than 2%")).toBe(2);
    expect(evangelicalFloorPercent("15% or Greater but Less than 20%")).toBe(15);
    expect(evangelicalFloorPercent(null)).toBeNull();
  });
});

describe("US state assignment", () => {
  it("assigns the state of the published point and ignores contradictory location prose", () => {
    const group = toPublicPeopleGroup({
      PGID: "PG043186",
      DisplayName: "Cajuns",
      ISOAlpha3: "USA",
      CountryName: "United States",
      Population: 79000,
      EvangelicalLevel: "Less than 2%",
      Lat: 29.69,
      Long: -91.61,
      LocationDescription: "Louisiana: coast; Texas: small border area SENTINEL_LOCATION_TEXT",
    });
    expect(group?.usStates).toEqual(["LA"]);
    expect(JSON.stringify(group)).not.toContain("SENTINEL_LOCATION_TEXT");
  });

  it("uses location names only when the published point is missing", () => {
    const group = toPublicPeopleGroup({
      PGID: "PG900004",
      DisplayName: "Description Only Group",
      ISOAlpha3: "USA",
      CountryName: "United States",
      Population: 1200,
      EvangelicalLevel: "Less than 2%",
      Lat: null,
      Long: null,
      LocationDescription: "Texas: SENTINEL_LOCATION_TEXT near Lufkin",
    });
    expect(group?.usStates).toEqual(["TX"]);
    expect(JSON.stringify(group)).not.toContain("SENTINEL_LOCATION_TEXT");
  });
});

describe("status and coordinates", () => {
  it("does not infer unreached from GSEC when the evangelical band is missing", () => {
    const group = toPublicPeopleGroup({
      PGID: "PG000222",
      DisplayName: "No band",
      ISOAlpha3: "BEN",
      CountryName: "Benin",
      GSEC: 424242,
      EngStat: "SENTINEL_ENGAGEMENT_STATUS",
    });
    expect(group?.unreached).toBeNull();
    expect(group?.evangelicalBand).toBeNull();
    expect(serialized(group)).not.toContain("424242");
    expect(serialized(group)).not.toContain("SENTINEL_ENGAGEMENT_STATUS");
  });

  it("rounds coordinates to 1 decimal in a World Watch List country and drops photos", () => {
    const group = toPublicPeopleGroup({
      PGID: "PG000333",
      DisplayName: "Kabul Test",
      ISOAlpha3: "AFG",
      CountryName: "Afghanistan",
      Population: 1000,
      EvangelicalLevel: "Less than 2%",
      Lat: 34.555,
      Long: 69.207,
      GSEC: 424242,
      PicURL: "https://example.invalid/SENTINEL_PHOTO",
      LocationDescription: "SENTINEL_LOCATION_TEXT precise village",
      EngStat: "SENTINEL_ENGAGEMENT_STATUS",
      SPI: 1,
      SPIdesc: "SENTINEL_ENGAGEMENT_PROGRESS",
      CongExst: "SENTINEL_CONGREGATIONS",
      Plnting: "SENTINEL_CHURCH_PLANTING",
      GSEClng: "SENTINEL_GSEC_LONG",
    });
    expect(group).toMatchObject({
      unreached: true,
      evangelicalBand: "Less than 2%",
      latitude: 34.6,
      longitude: 69.2,
      coordinatesRounded: true,
      usStates: [],
    });
    const text = serialized(group);
    for (const sentinel of SENTINELS) expect(text).not.toContain(sentinel);
    expect(text).not.toMatch(/GSEC|PicURL|EngStat|LocationDesc/i);
  });
});
