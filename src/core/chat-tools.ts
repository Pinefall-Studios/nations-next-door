import { imbAttribution } from "./attribution.js";
import { PeopleGroupsError } from "./errors.js";
import type { PeopleGroupsService } from "./service.js";
import type { PublicPeopleGroup } from "./types.js";

/** Keys and strings that must never appear in a chat-tool payload. */
export const BANNED_CHAT_MARKERS = [
  "GSEC",
  "GSECDescription",
  "GSECLongDescription",
  "GSECbrf",
  "GSEClng",
  "EngStat",
  "EngagementStatus",
  "EngagementProgress",
  "SPI",
  "SPIdesc",
  "CongExst",
  "CongregationsExist",
  "Plnting",
  "ChurchPlanting",
  "LocationDesc",
  "LocationDescription",
  "PicURL",
  "PhotoURL",
  "FieldWorkers",
  "Missionaries",
  "LocalBelievers",
  "SecurityLevel",
] as const;

export interface ChatGroup {
  pgid: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  usStates: string[];
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  coordinatesRounded: boolean;
  languageName: string | null;
  languageCode: string | null;
  religion: string | null;
  unreached: boolean | null;
  evangelicalBand: string | null;
  bible: string | null;
  unfoldingWord: string | null;
}

export interface ChatToolList {
  total: number;
  groups: ChatGroup[];
  attribution: string;
}

export interface MapFocus {
  label: string;
  pgids: string[];
  bounds: [number, number, number, number] | null;
}

export interface ChatToolFocus {
  attribution: string;
  map: MapFocus;
  groups: ChatGroup[];
}

export function toChatGroup(group: PublicPeopleGroup): ChatGroup {
  const language = group.primaryLanguage.code;
  return {
    pgid: group.pgid,
    name: group.name,
    country: group.country,
    countryCode: group.countryCode,
    usStates: group.usStates,
    population: group.population,
    latitude: group.latitude,
    longitude: group.longitude,
    coordinatesRounded: group.coordinatesRounded,
    languageName: group.primaryLanguage.name,
    languageCode: language,
    religion: group.religion.name,
    unreached: group.unreached,
    evangelicalBand: group.evangelicalBand,
    bible: group.scriptureAvailability.bible,
    unfoldingWord: language
      ? `https://git.door43.org/api/v1/catalog/search?lang=${language}`
      : null,
  };
}

export function assertChatPayloadIsPublic(payload: unknown): void {
  const text = JSON.stringify(payload);
  for (const marker of BANNED_CHAT_MARKERS) {
    if (text.includes(marker)) {
      throw new PeopleGroupsError("Refusing to return engagement or worker fields.");
    }
  }
}

function boundsOf(groups: ChatGroup[]): [number, number, number, number] | null {
  const points = groups.filter(
    (group): group is ChatGroup & { latitude: number; longitude: number } =>
      group.latitude !== null && group.longitude !== null,
  );
  if (points.length === 0) return null;
  const lngs = points.map((group) => group.longitude);
  const lats = points.map((group) => group.latitude);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const padLng = Math.max((east - west) * 0.15, 0.8);
  const padLat = Math.max((north - south) * 0.15, 0.8);
  return [west - padLng, south - padLat, east + padLng, north + padLat];
}

function listPayload(
  groups: PublicPeopleGroup[],
  total: number,
  attribution: string,
): ChatToolList {
  const payload = {
    total,
    groups: groups.map(toChatGroup),
    attribution,
  };
  assertChatPayloadIsPublic(payload);
  return payload;
}

export async function chatListByCountry(
  service: PeopleGroupsService,
  input: { country: string; unreachedOnly?: boolean; limit?: number },
): Promise<ChatToolList> {
  const result = await service.listPeopleGroupsByCountry({
    country: input.country,
    unreachedOnly: input.unreachedOnly ?? true,
    limit: input.limit ?? 25,
  });
  return listPayload(result.groups, result.total, result.attribution);
}

export async function chatListByUsState(
  service: PeopleGroupsService,
  input: { state: string; unreachedOnly?: boolean; limit?: number },
): Promise<ChatToolList> {
  const result = await service.listPeopleGroupsByUsState({
    state: input.state,
    unreachedOnly: input.unreachedOnly ?? true,
    limit: input.limit ?? 25,
  });
  return listPayload(result.groups, result.total, result.attribution);
}

export async function chatListByLanguage(
  service: PeopleGroupsService,
  input: { language: string; country?: string; unreachedOnly?: boolean; limit?: number },
): Promise<ChatToolList> {
  const result = await service.listPeopleGroupsByLanguage({
    language: input.language,
    country: input.country,
    unreachedOnly: input.unreachedOnly,
    limit: input.limit ?? 25,
  });
  return listPayload(result.groups, result.total, result.attribution);
}

export async function chatGetGroup(
  service: PeopleGroupsService,
  input: { pgid: string },
): Promise<{ group: ChatGroup; attribution: string }> {
  const result = await service.getPeopleGroup(input);
  const payload = { group: toChatGroup(result.group), attribution: result.attribution };
  assertChatPayloadIsPublic(payload);
  return payload;
}

export async function chatShowOnMap(
  service: PeopleGroupsService,
  input: { country?: string; state?: string; language?: string; pgid?: string },
): Promise<ChatToolFocus> {
  let groups: PublicPeopleGroup[] = [];
  let attribution = imbAttribution(new Date());
  let label = "this view";

  if (input.pgid) {
    const result = await service.getPeopleGroup({ pgid: input.pgid });
    groups = [result.group];
    attribution = result.attribution;
    label = result.group.name;
  } else if (input.state) {
    const result = await service.listPeopleGroupsByUsState({
      state: input.state,
      unreachedOnly: true,
      limit: 100,
    });
    groups = result.groups;
    attribution = result.attribution;
    label = input.state;
  } else if (input.language) {
    const result = await service.listPeopleGroupsByLanguage({
      language: input.language,
      country: input.country,
      unreachedOnly: true,
      limit: 100,
    });
    groups = result.groups;
    attribution = result.attribution;
    label = input.language;
  } else if (input.country) {
    const result = await service.listPeopleGroupsByCountry({
      country: input.country,
      unreachedOnly: true,
      limit: 100,
    });
    groups = result.groups;
    attribution = result.attribution;
    label = input.country;
  }

  const chatGroups = groups.map(toChatGroup);
  const payload: ChatToolFocus = {
    attribution,
    groups: chatGroups,
    map: {
      label: `Showing ${label}`,
      pgids: chatGroups.map((group) => group.pgid),
      bounds: boundsOf(chatGroups),
    },
  };
  assertChatPayloadIsPublic(payload);
  return payload;
}
