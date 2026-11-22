import { describe, expect, it } from "vitest";
import { UnknownPlaceError } from "../src/core/errors.js";
import { resolveCountry } from "../src/core/places.js";
import { resolveUsState, statesNamedIn } from "../src/core/states.js";
import { stateForPoint } from "../src/core/state-geometry.js";

describe("resolveCountry", () => {
  it("accepts names, alpha-3 codes, and alpha-2 codes", () => {
    expect(resolveCountry("Benin")).toBe("BEN");
    expect(resolveCountry("United States")).toBe("USA");
    expect(resolveCountry("United States of America")).toBe("USA");
    expect(resolveCountry("U.S.")).toBe("USA");
    expect(resolveCountry("USA")).toBe("USA");
    expect(resolveCountry("us")).toBe("USA");
    expect(resolveCountry("IN")).toBe("IND");
    expect(resolveCountry("India")).toBe("IND");
    expect(resolveCountry("Turkey")).toBe("TUR");
    expect(resolveCountry("Türkiye")).toBe("TUR");
    expect(resolveCountry("Russia")).toBe("RUS");
    expect(resolveCountry("UK")).toBe("GBR");
    expect(resolveCountry("Vietnam")).toBe("VNM");
    expect(resolveCountry("GA")).toBe("GAB");
    expect(resolveCountry("CA")).toBe("CAN");
  });

  it("refuses ambiguous country names", () => {
    expect(() => resolveCountry("Korea")).toThrow(UnknownPlaceError);
    expect(() => resolveCountry("Congo")).toThrow(/Democratic Republic/);
  });
});

describe("resolveUsState", () => {
  it("accepts names and postal codes, including the District of Columbia", () => {
    expect(resolveUsState("Texas")).toEqual({ code: "TX", name: "Texas" });
    expect(resolveUsState("tx")).toEqual({ code: "TX", name: "Texas" });
    expect(resolveUsState("West Virginia")).toEqual({ code: "WV", name: "West Virginia" });
    expect(resolveUsState("D.C.")).toEqual({ code: "DC", name: "District of Columbia" });
    expect(resolveUsState("Washington, D.C.")).toEqual({ code: "DC", name: "District of Columbia" });
    expect(resolveUsState("Washington")).toEqual({ code: "WA", name: "Washington" });
    expect(resolveUsState("GA")).toEqual({ code: "GA", name: "Georgia" });
    expect(resolveUsState("CA")).toEqual({ code: "CA", name: "California" });
  });

  it("tells the caller that territories are outside this tool", () => {
    expect(() => resolveUsState("Puerto Rico")).toThrow(/territory/i);
  });
});

describe("statesNamedIn", () => {
  it("finds every named state and does not double-count a longer name", () => {
    expect(statesNamedIn("Louisiana: coast; Texas: small border area")).toEqual(
      expect.arrayContaining(["LA", "TX"]),
    );
    expect(statesNamedIn("West Virginia: Charleston")).toEqual(["WV"]);
    expect(statesNamedIn("Washington, D.C.: northwest")).toEqual(["DC"]);
    expect(statesNamedIn("Washington: Puget Sound")).toEqual(["WA"]);
    expect(statesNamedIn("Oklahoma: Caddo county")).toEqual(["OK"]);
  });
});

describe("stateForPoint", () => {
  it("places known cities in the right state", () => {
    expect(stateForPoint(31.3382, -94.7291)).toBe("TX");
    expect(stateForPoint(30.2672, -97.7431)).toBe("TX");
    expect(stateForPoint(35.4676, -97.5164)).toBe("OK");
    expect(stateForPoint(29.9511, -90.0715)).toBe("LA");
    expect(stateForPoint(47.6062, -122.3321)).toBe("WA");
    expect(stateForPoint(38.3498, -81.6326)).toBe("WV");
    expect(stateForPoint(37.5407, -77.436)).toBe("VA");
    expect(stateForPoint(38.9072, -77.0369)).toBe("DC");
    expect(stateForPoint(21.3069, -157.8583)).toBe("HI");
    expect(stateForPoint(61.2181, -149.9003)).toBe("AK");
  });
});
