import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { createPeopleGroupsService, type PeopleGroupsService } from "./core/index.js";
import {
  handleGetPeopleGroup,
  handleListPeopleGroupsByLanguage,
  handleListUnreachedByCountry,
  handleListUnreachedByUsState,
  SERVER_INSTRUCTIONS,
} from "./mcp/tools.js";

const limit = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe("How many groups to return. Default 25. Maximum 100.");
const offset = z
  .number()
  .int()
  .min(0)
  .optional()
  .describe("How many matching groups to skip. Default 0.");

/**
 * Thin MCP wrapper. The query functions live in src/core and are what the
 * later site and chat agent import. Do not copy that logic into a tool.
 */
export function createServer(service: PeopleGroupsService = createPeopleGroupsService()): McpServer {
  const server = new McpServer(
    { name: "nations-next-door", version: "0.1.0" },
    { instructions: SERVER_INSTRUCTIONS },
  );

  server.registerTool(
    "list_unreached_by_country",
    {
      title: "Unreached people groups in a country",
      description:
        "List unreached people groups in a country from IMB Global Research. Unreached means less than 2% evangelical. Pass an English name or an ISO code (India, USA, US). Two-letter codes are countries: GA is Gabon and CA is Canada, not Georgia or California. Returns public aggregate fields only, with IMB attribution. It does not return workers, believers, or engagement.",
      inputSchema: z.object({
        country: z.string().min(1).max(80).describe("Country name or ISO code, such as India, USA, or US."),
        limit,
        offset,
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    },
    async (args) => handleListUnreachedByCountry(service, args),
  );

  server.registerTool(
    "list_unreached_by_us_state",
    {
      title: "Unreached people groups in a US state",
      description:
        "List unreached people groups in a US state or the District of Columbia. Pass a name or postal code (Texas or TX). Two-letter codes are USPS codes: GA is Georgia and CA is California. State comes from the published point (US Census state boundaries) and from state names in the published location description. The description text is not returned. A group can match more than one state. Territories such as Puerto Rico are not covered. Public aggregate fields only, with IMB attribution.",
      inputSchema: z.object({
        state: z.string().min(1).max(60).describe("US state name or postal code, such as Texas or TX."),
        limit,
        offset,
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    },
    async (args) => handleListUnreachedByUsState(service, args),
  );

  server.registerTool(
    "get_people_group",
    {
      title: "One people group's public details",
      description:
        "Get one people group by PGID (for example PG012345) from IMB Global Research. Returns name, population, language and ISO 639-3 code, religion, an unreached yes or no, and the evangelical band, plus other public aggregate fields. It does not return GSEC, engagement, workers, believers, photos, or the location narrative. Includes IMB attribution.",
      inputSchema: z.object({
        pgid: z.string().describe("People group id, such as PG012345."),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    },
    async (args) => handleGetPeopleGroup(service, args),
  );

  server.registerTool(
    "list_people_groups_by_language",
    {
      title: "People groups by language code",
      description:
        "List people groups whose primary language matches an ISO 639-3 / ROL code (for example ntm or spa). Optional country narrows the list. Set unreachedOnly when you only want groups under 2% evangelical. Public aggregate fields only, with IMB attribution.",
      inputSchema: z.object({
        language: z.string().describe("Three-letter ISO 639-3 / ROL code, such as ntm."),
        country: z
          .string()
          .min(1)
          .max(80)
          .optional()
          .describe("Optional country name or ISO code. Two-letter codes are countries, not US states."),
        unreachedOnly: z.boolean().optional().describe("When true, keep only unreached groups."),
        limit,
        offset,
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    },
    async (args) => handleListPeopleGroupsByLanguage(service, args),
  );

  return server;
}
