import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { demoAnswer } from "../../../lib/demo-answer";
import { getCatalog } from "../../../lib/catalog";

export const runtime = "nodejs";

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
    return Response.json({
      demo: true,
      text: demoAnswer(question || "Who is unreached in Texas?", catalog.groups, catalog.attribution),
    });
  }

  const result = streamText({
    model: "openai/gpt-5.4",
    system: [
      "You are a careful librarian for Nations Next Door.",
      "Answer only from the public people-group facts in the user message.",
      "Cite the source line on every answer.",
      "Refuse questions about field workers, local believers, congregations, engagement, or GSEC.",
      "Do not invent numbers.",
      `Source line: ${catalog.attribution}`,
      `Facts: ${JSON.stringify(catalog.groups.map((group) => ({
        name: group.name,
        country: group.country,
        states: group.usStates,
        population: group.population,
        language: group.languageName,
        code: group.languageCode,
        religion: group.religion,
        unreached: group.unreached,
        evangelicalBand: group.evangelicalBand,
        bible: group.bible,
      })))}`,
    ].join("\n"),
    messages: await convertToModelMessages(body.messages ?? []),
  });
  return result.toUIMessageStreamResponse();
}
