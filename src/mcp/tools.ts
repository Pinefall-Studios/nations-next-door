import type { CallToolResult } from "@modelcontextprotocol/server";
import { imbAttribution } from "../core/attribution.js";
import { PeopleGroupsError } from "../core/errors.js";
import type { PeopleGroupsService } from "../core/service.js";

export const SERVER_INSTRUCTIONS = [
  "Nations Next Door answers who is unreached in a US state or a country, using public aggregate people-group data from IMB Global Research (PeopleGroups.org).",
  "Unreached is a yes or no from the evangelical band: yes means less than 2% evangelical. Do not report GSEC or engagement.",
  "Keep the IMB attribution that every tool returns with any fact you repeat.",
  "Do not answer questions about field workers, missionaries, local believers, congregations, or engagement in restricted-access places. This server does not have that data and will not infer it.",
  "Two-letter codes mean different things in different tools: in the country tool, GA is Gabon and CA is Canada; in the US state tool, GA is Georgia and CA is California.",
].join(" ");

function present(payload: unknown): CallToolResult {
  const attribution =
    typeof payload === "object" &&
    payload !== null &&
    "attribution" in payload &&
    typeof payload.attribution === "string"
      ? payload.attribution
      : imbAttribution(new Date());
  return {
    content: [{ type: "text", text: `${attribution}\n\n${JSON.stringify(payload, null, 2)}` }],
  };
}

function fail(error: unknown): CallToolResult {
  const text =
    error instanceof PeopleGroupsError
      ? error.message
      : "The people-group request failed. Try again shortly.";
  return { isError: true, content: [{ type: "text", text }] };
}

export async function handleListUnreachedByCountry(
  service: PeopleGroupsService,
  args: { country: string; limit?: number; offset?: number },
): Promise<CallToolResult> {
  try {
    return present(await service.listUnreachedByCountry(args));
  } catch (error) {
    return fail(error);
  }
}

export async function handleListUnreachedByUsState(
  service: PeopleGroupsService,
  args: { state: string; limit?: number; offset?: number },
): Promise<CallToolResult> {
  try {
    return present(await service.listUnreachedByUsState(args));
  } catch (error) {
    return fail(error);
  }
}

export async function handleGetPeopleGroup(
  service: PeopleGroupsService,
  args: { pgid: string },
): Promise<CallToolResult> {
  try {
    return present(await service.getPeopleGroup(args));
  } catch (error) {
    return fail(error);
  }
}

export async function handleListPeopleGroupsByLanguage(
  service: PeopleGroupsService,
  args: {
    language: string;
    country?: string;
    unreachedOnly?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<CallToolResult> {
  try {
    return present(await service.listPeopleGroupsByLanguage(args));
  } catch (error) {
    return fail(error);
  }
}
