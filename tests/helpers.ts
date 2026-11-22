import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function loadFixture<T>(name: string): T {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

export function poison<T extends Record<string, unknown>>(record: T): T & Record<string, unknown> {
  return {
    ...record,
    EngagementStatus: "SENTINEL_ENGAGEMENT_STATUS",
    EngagementProgress: 99,
    EngagementProgressDesc: "SENTINEL_ENGAGEMENT_PROGRESS",
    CongregationsExist: "SENTINEL_CONGREGATIONS",
    ChurchPlantingWithinLast2Years: "SENTINEL_CHURCH_PLANTING",
    EngStat: "SENTINEL_ENGAGEMENT_STATUS",
    SPI: 99,
    SPIdesc: "SENTINEL_ENGAGEMENT_PROGRESS",
    CongExst: "SENTINEL_CONGREGATIONS",
    Plnting: "SENTINEL_CHURCH_PLANTING",
    FieldWorkers: "SENTINEL_FIELD_WORKERS",
    Missionaries: "SENTINEL_MISSIONARIES",
    LocalBelievers: "SENTINEL_LOCAL_BELIEVERS",
    PejorativeAltNames: "SENTINEL_PEJORATIVE",
    PhotoURL: "https://example.invalid/SENTINEL_PHOTO",
    PhotoCredit: "SENTINEL_PHOTO_CREDIT",
    PicURL: "https://example.invalid/SENTINEL_PHOTO",
    GSECDescription: "SENTINEL_GSEC_TEXT church planting",
    GSECLongDescription: "SENTINEL_GSEC_LONG church planting",
    GSECbrf: "SENTINEL_GSEC_TEXT",
    GSEClng: "SENTINEL_GSEC_LONG",
  };
}

export const SENTINELS = [
  "SENTINEL_ENGAGEMENT_STATUS",
  "SENTINEL_ENGAGEMENT_PROGRESS",
  "SENTINEL_CONGREGATIONS",
  "SENTINEL_CHURCH_PLANTING",
  "SENTINEL_FIELD_WORKERS",
  "SENTINEL_MISSIONARIES",
  "SENTINEL_LOCAL_BELIEVERS",
  "SENTINEL_PEJORATIVE",
  "SENTINEL_PHOTO",
  "SENTINEL_GSEC_TEXT",
  "SENTINEL_GSEC_LONG",
  "SENTINEL_LOCATION_TEXT",
];
