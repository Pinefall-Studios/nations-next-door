import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import * as z from "zod/v4";
import {
  chatGetGroup,
  chatListByCountry,
  chatListByLanguage,
  chatListByUsState,
  chatShowOnMap,
} from "../../../../../src/core/chat-tools";
import { demoAnswer } from "../../../lib/demo-answer";
import { getCatalog } from "../../../lib/catalog";
import { peopleGroups } from "../../../lib/service";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = [
  "You are a careful librarian for Nations Next Door, a free non-commercial church tool.",
  "Answer only from public aggregate people-group data returned by your tools.",
  "Unreached means the evangelical band is under 2%. Never mention or infer GSEC.",
  "Refuse questions about field workers, missionaries, local believers, congregations, engagement, GSEC, or security-sensitive locations. Say you do not have that.",
  "Every answer is one short sentence plus the matching groups. Put the IMB source line on its own last line.",
  "The number in that sentence must equal the number of groups the tool returned. Do not say five and list four.",
  "When the user asks to see a place or groups on the map, call showOnMap.",
  "Do not invent numbers. If a tool returns nothing, say the public record does not list it.",
  "Do not put Bible Brain audio or text in the answer. You may mention that a listing link exists.",
].join(" ");

export async function GET() {
  return Response.json({
    demo: !process.env.AI_GATEWAY_API_KEY,
    model: process.env.AI_GATEWAY_MODEL ?? null,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: UIMessage[]; question?: string };
  const catalog = getCatalog();
  const last = body.messages?.at(-1);
  const textPart = last && "parts" in last
    ? last.parts?.find((part) => part.type === "text")
    : undefined;
  const question = body.question
    ?? (textPart && "text" in textPart ? textPart.text : "");

  if (!process.env.AI_GATEWAY_API_KEY) {
    const reply = demoAnswer(question || "Who is unreached in Texas?", catalog.groups, catalog.attribution);
    return Response.json({ demo: true, ...reply, attribution: catalog.attribution });
  }

  const service = peopleGroups();
  const model = process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1";
  const result = streamText({
    model,
    system: SYSTEM,
    messages: await convertToModelMessages(body.messages ?? []),
    stopWhen: stepCountIs(6),
    tools: {
      listGroupsByCountry: tool({
        description: "List public people groups in a country. Defaults to unreached only.",
        inputSchema: z.object({
          country: z.string().describe("Country name or ISO code such as Benin or USA"),
          unreachedOnly: z.boolean().optional(),
        }),
        execute: async ({ country, unreachedOnly }) => chatListByCountry(service, { country, unreachedOnly }),
      }),
      listGroupsByUsState: tool({
        description: "List public people groups in a US state. Defaults to unreached only.",
        inputSchema: z.object({
          state: z.string().describe("State name or postal code such as Texas or TX"),
          unreachedOnly: z.boolean().optional(),
        }),
        execute: async ({ state, unreachedOnly }) => chatListByUsState(service, { state, unreachedOnly }),
      }),
      listGroupsByLanguage: tool({
        description: "List public people groups by ISO 639-3 language code.",
        inputSchema: z.object({
          language: z.string().describe("Three-letter language code such as ntm or spa"),
          country: z.string().optional(),
          unreachedOnly: z.boolean().optional(),
        }),
        execute: async ({ language, country, unreachedOnly }) =>
          chatListByLanguage(service, { language, country, unreachedOnly }),
      }),
      getGroup: tool({
        description: "Get one people group by PGID.",
        inputSchema: z.object({ pgid: z.string() }),
        execute: async ({ pgid }) => chatGetGroup(service, { pgid }),
      }),
      showOnMap: tool({
        description: "Focus the map on unreached groups in a country, US state, language, or one PGID.",
        inputSchema: z.object({
          country: z.string().optional(),
          state: z.string().optional(),
          language: z.string().optional(),
          pgid: z.string().optional(),
        }),
        execute: async (input) => chatShowOnMap(service, input),
      }),
    },
  });
  return result.toUIMessageStreamResponse();
}
