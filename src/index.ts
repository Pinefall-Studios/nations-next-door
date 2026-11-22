import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createPeopleGroupsService } from "./core/index.js";
import { createServer } from "./server.js";

const service = createPeopleGroupsService();
void serveStdio(() => createServer(service));
console.error("nations-next-door MCP server listening on stdio");
