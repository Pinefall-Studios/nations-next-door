import { describe, expect, it } from "vitest";
import { bboxForState, boundsForStateAndPoints } from "../src/core/state-geometry.js";

describe("boundsForStateAndPoints", () => {
  it("returns the unpadded Texas polygon, ignoring a far-off group", () => {
    const texas = bboxForState("TX");
    expect(texas).not.toBeNull();
    const union = boundsForStateAndPoints("TX", [
      { latitude: 29.76, longitude: -95.36 },
      { latitude: 37.77, longitude: -122.42 },
    ]);
    expect(union).toEqual(texas);
    if (!union) return;
    const [west, south, east, north] = union;
    expect(west).toBeGreaterThan(-110);
    expect(west).toBeLessThan(-103);
    expect(south).toBeGreaterThan(24);
    expect(south).toBeLessThan(27);
    expect(east).toBeGreaterThan(-95);
    expect(east).toBeLessThan(-92);
    expect(north).toBeGreaterThan(35.5);
    expect(north).toBeLessThan(37.5);
  });
});
