import { IMB_ATTRIBUTION, IMB_SOURCE, US_STATE_GEOGRAPHY_NOTE } from "./attribution.js";
import { MemoryCache } from "./cache.js";
import {
  InvalidQueryError,
  PeopleGroupNotFoundError,
  PeopleGroupsError,
  QueryTooBroadError,
  UnknownPlaceError,
} from "./errors.js";
import { resolveCountry } from "./places.js";
import { toPublicPeopleGroup } from "./project.js";
import { resolveUsState } from "./states.js";
import type { PeopleGroupDetails, PeopleGroupList, PublicPeopleGroup } from "./types.js";

const DEFAULT_BASE_URL = "https://peoplegroups.org/wp-json/pg/v1";
const USER_AGENT = "NationsNextDoor/0.1 (non-commercial church research; +https://peoplegroups.org/using-the-api/)";
const MAX_PAGES = 20;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export interface PeopleGroupsService {
  listUnreachedByCountry(input: {
    country: string;
    limit?: number;
    offset?: number;
  }): Promise<PeopleGroupList>;
  listUnreachedByUsState(input: {
    state: string;
    limit?: number;
    offset?: number;
  }): Promise<PeopleGroupList>;
  getPeopleGroup(input: { pgid: string }): Promise<PeopleGroupDetails>;
  listPeopleGroupsByLanguage(input: {
    language: string;
    country?: string;
    unreachedOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PeopleGroupList>;
}

export interface PeopleGroupsOptions {
  fetch?: typeof fetch;
  baseUrl?: string;
  cacheTtlMs?: number;
  pageDelayMs?: number;
  now?: () => number;
}

interface CachedGroups {
  groups: PublicPeopleGroup[];
  fetchedAt: string;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePgid(input: string): string {
  const pgid = input.trim().toUpperCase();
  if (!/^PG[0-9]{6}$/.test(pgid)) {
    throw new InvalidQueryError("People group id should look like PG012345.");
  }
  return pgid;
}

export function normalizeLanguage(input: string): string {
  const code = input.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(code)) {
    throw new InvalidQueryError(
      "Language code should be a three-letter ISO 639-3 / ROL code such as ntm or spa.",
    );
  }
  return code;
}

function resolvePage(limit: number | undefined, offset: number | undefined): {
  limit: number;
  offset: number;
} {
  const resolvedLimit = limit === undefined ? DEFAULT_LIMIT : limit;
  if (!Number.isInteger(resolvedLimit) || resolvedLimit < 1 || resolvedLimit > MAX_LIMIT) {
    throw new InvalidQueryError("limit must be an integer from 1 to 100.");
  }
  const resolvedOffset = offset === undefined ? 0 : offset;
  if (!Number.isInteger(resolvedOffset) || resolvedOffset < 0) {
    throw new InvalidQueryError("offset must be an integer of 0 or more.");
  }
  return { limit: resolvedLimit, offset: resolvedOffset };
}

function orderGroups(groups: PublicPeopleGroup[]): PublicPeopleGroup[] {
  return [...groups].sort((a, b) => {
    const byPopulation = (b.population ?? -1) - (a.population ?? -1);
    if (byPopulation !== 0) return byPopulation;
    return a.name.localeCompare(b.name) || a.pgid.localeCompare(b.pgid);
  });
}

function pageGroups(
  groups: PublicPeopleGroup[],
  limit: number | undefined,
  offset: number | undefined,
): { total: number; limit: number; offset: number; groups: PublicPeopleGroup[] } {
  const page = resolvePage(limit, offset);
  const ordered = orderGroups(groups);
  return {
    total: ordered.length,
    limit: page.limit,
    offset: page.offset,
    groups: ordered.slice(page.offset, page.offset + page.limit),
  };
}

function assertPublicRequest(url: URL): void {
  if (url.pathname.includes("/export") || url.pathname.endsWith("/stats") || url.pathname.endsWith("/countries")) {
    throw new PeopleGroupsError("Refusing to call a bulk or engagement endpoint.");
  }
  for (const key of url.searchParams.keys()) {
    const folded = key.toLowerCase();
    if (folded === "engagement" || folded.includes("worker") || folded.includes("missionary")) {
      throw new PeopleGroupsError("Refusing to request engagement or worker data.");
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createPeopleGroupsService(options: PeopleGroupsOptions = {}): PeopleGroupsService {
  const fetchImpl = options.fetch ?? fetch;
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const now = options.now ?? Date.now;
  const cacheTtlMs = options.cacheTtlMs ?? envNumber("PEOPLEGROUPS_CACHE_TTL_SECONDS", 600) * 1000;
  const pageDelayMs = options.pageDelayMs ?? envNumber("PEOPLEGROUPS_PAGE_DELAY_MS", 150);
  const cache = new MemoryCache<CachedGroups>(cacheTtlMs, now);

  async function readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new PeopleGroupsError("PeopleGroups.org returned an unexpected response.");
    }
  }

  async function fetchPages(query: Record<string, string>): Promise<CachedGroups> {
    const cacheKey = Object.keys(query)
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join("&");
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const groups: PublicPeopleGroup[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      if (page > MAX_PAGES) {
        throw new QueryTooBroadError(
          "That query matches more people groups than this tool will download in one pass. Add a country, or ask for one people group by id.",
        );
      }
      const url = new URL(`${baseUrl}/people-groups`);
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
      url.searchParams.set("per_page", "250");
      url.searchParams.set("page", String(page));
      assertPublicRequest(url);

      const response = await fetchImpl(url, {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      const payload = await readJson(response);
      if (response.status === 400) {
        const message = isRecord(payload) && typeof payload.message === "string" ? payload.message : "";
        if (message.toLowerCase().includes("invalid parameter")) {
          throw new UnknownPlaceError(
            "PeopleGroups.org did not recognize that country or language. Use an English country name or an ISO code such as USA, and a three-letter language code.",
          );
        }
        throw new PeopleGroupsError("PeopleGroups.org rejected the request.");
      }
      if (!response.ok) {
        throw new PeopleGroupsError(
          `PeopleGroups.org returned HTTP ${response.status}. Try again shortly.`,
        );
      }
      if (!Array.isArray(payload)) {
        throw new PeopleGroupsError("PeopleGroups.org returned an unexpected response.");
      }
      for (const row of payload) {
        const group = toPublicPeopleGroup(row);
        if (group) groups.push(group);
      }
      const header = response.headers.get("x-wp-totalpages") ?? response.headers.get("X-WP-TotalPages");
      const parsed = header ? Number(header) : 1;
      totalPages = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
      page += 1;
      if (page <= totalPages && pageDelayMs > 0) await delay(pageDelayMs);
    } while (page <= totalPages);

    const result = { groups, fetchedAt: new Date(now()).toISOString() };
    cache.set(cacheKey, result);
    return result;
  }

  function listResult(
    groups: PublicPeopleGroup[],
    fetchedAt: string,
    limit: number | undefined,
    offset: number | undefined,
    geographyNote?: string,
  ): PeopleGroupList {
    return {
      ...pageGroups(groups, limit, offset),
      attribution: IMB_ATTRIBUTION,
      sources: [IMB_SOURCE],
      retrievedAt: fetchedAt,
      ...(geographyNote ? { geographyNote } : {}),
    };
  }

  return {
    async listUnreachedByCountry(input) {
      const country = resolveCountry(input.country);
      const loaded = await fetchPages({ country });
      const unreached = loaded.groups.filter((group) => group.reachedStatus === "unreached");
      return listResult(unreached, loaded.fetchedAt, input.limit, input.offset);
    },

    async listUnreachedByUsState(input) {
      const state = resolveUsState(input.state);
      const loaded = await fetchPages({ country: "USA" });
      const unreached = loaded.groups.filter(
        (group) => group.reachedStatus === "unreached" && group.usStates.includes(state.code),
      );
      return listResult(unreached, loaded.fetchedAt, input.limit, input.offset, US_STATE_GEOGRAPHY_NOTE);
    },

    async getPeopleGroup(input) {
      const pgid = normalizePgid(input.pgid);
      const url = new URL(`${baseUrl}/people-groups/${encodeURIComponent(pgid)}`);
      assertPublicRequest(url);
      const response = await fetchImpl(url, {
        headers: { accept: "application/json", "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 404) {
        throw new PeopleGroupNotFoundError(`No people group found for ${pgid}.`);
      }
      const payload = await readJson(response);
      if (!response.ok) {
        throw new PeopleGroupsError(
          `PeopleGroups.org returned HTTP ${response.status}. Try again shortly.`,
        );
      }
      if (isRecord(payload) && payload.code === "pg_not_found") {
        throw new PeopleGroupNotFoundError(`No people group found for ${pgid}.`);
      }
      const group = toPublicPeopleGroup(payload);
      if (!group) throw new PeopleGroupNotFoundError(`No people group found for ${pgid}.`);
      return {
        group,
        attribution: IMB_ATTRIBUTION,
        sources: [IMB_SOURCE],
        retrievedAt: new Date(now()).toISOString(),
      };
    },

    async listPeopleGroupsByLanguage(input) {
      const language = normalizeLanguage(input.language);
      const query: Record<string, string> = { language };
      if (input.country !== undefined && input.country.trim() !== "") {
        query.country = resolveCountry(input.country);
      }
      const loaded = await fetchPages(query);
      const groups = input.unreachedOnly
        ? loaded.groups.filter((group) => group.reachedStatus === "unreached")
        : loaded.groups;
      return listResult(groups, loaded.fetchedAt, input.limit, input.offset);
    },
  };
}
