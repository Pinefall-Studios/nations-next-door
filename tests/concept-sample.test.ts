import { describe, expect, it } from "vitest";
import { toPublicPeopleGroup } from "../src/core/project.js";

describe("concept sample stays inside the public allowlist", () => {
  it("rounds Afghanistan and does not emit GSEC or engagement", () => {
    const group = toPublicPeopleGroup({
      PGID: "PG023938",
      DisplayName: "Aimaq",
      CountryName: "Afghanistan",
      ISOAlpha3: "AFG",
      Population: 1480000,
      LanguageName: "Dari",
      LanguageCode: "prs",
      ReligionName: "Islam - Sunni",
      EvangelicalLevel: "Less than 2%",
      Lat: 34.27,
      Long: 64.62,
      BibleAvailability: "Available",
      GSEC: 424242,
      EngagementStatus: "SENTINEL_ENGAGEMENT_STATUS",
      PicURL: "https://example.invalid/SENTINEL_PHOTO",
      LocationDescription: "SENTINEL_LOCATION_TEXT",
    });
    expect(group).toMatchObject({
      unreached: true,
      evangelicalBand: "Less than 2%",
      latitude: 34.3,
      longitude: 64.6,
      coordinatesRounded: true,
    });
    const text = JSON.stringify(group);
    expect(text).not.toContain("424242");
    expect(text).not.toContain("SENTINEL");
    expect(text).not.toMatch(/GSEC|Engagement|PicURL|LocationDesc/);
  });
});
