# Nations Next Door

Free, open-source help for a church missions team: who is unreached in my state or country, and what free resources exist in their language?

This repository is the code. The people-group facts come from public sources and stay under those sources' terms. The project is non-commercial. It does not collect or publish anything about field workers, local believers, missionaries, or engagement in restricted-access places.

The first pilot is the missions team at Carpenters Way Church in Lufkin, Texas. Version 1 is described in [docs/PLAN.md](docs/PLAN.md). This unit is the foundation and the IMB PeopleGroups.org tools. There is no website in this unit. The design direction for later units is [docs/DESIGN.md](docs/DESIGN.md). Mira signs off on the design before any UI pull request merges.

## Stack

TypeScript on Node.js 22. The MCP server uses [`@modelcontextprotocol/server`](https://github.com/modelcontextprotocol/typescript-sdk), the current stable MCP TypeScript SDK (v2). The older `@modelcontextprotocol/sdk` package is the v1 maintenance line and does not implement the current spec, so new work starts on v2.

The query functions live in `src/core`. `src/server.ts` only registers tools that call that library. The one-page site (unit 5) and the chat agent (unit 6) will import `createPeopleGroupsService` from `src/core/index.ts` so there is one implementation of each query. Tests use Vitest and recorded fixtures. ESLint and `tsc` run in CI.

## Data policy

- Public, aggregate data only. Tools return name, population, primary language and its ISO 639-3 code, religion, an unreached yes or no, the evangelical percentage band, and a short list of other public fields (country, coordinates, US state assignment, a public summary, and IMB's coarse Scripture-availability notes).
- Unreached means less than 2% evangelical. That is read only from the evangelical band. GSEC is not requested, stored, or returned, because the scale mixes in church-planting activity.
- The client copies an allowlist (`src/core/project.ts`). GSEC, engagement status, church-planting fields, congregation fields, photos, pejorative names, location narratives, and any worker, missionary, or believer fields are not copied. A test feeds those fields in and fails if they come back out. Committed fixtures do not contain them.
- Coordinates in Open Doors World Watch List 2026 countries are rounded to one decimal degree before they are returned. The United States is not on that list.
- The server does not call the PeopleGroups.org export route, the stats route, or the countries route. Those last two include engagement totals. It does not send an `engagement` query parameter.
- Results are cached in memory for 10 minutes by default, matching the `Cache-Control` max-age observed on the public API. The cache is not written to disk and is not a mirror of the dataset.
- Every tool response includes this credit, with the month and year of the fetch: "This information was provided by The International Mission Board - Global Research, [Month Year], Nations Next Door, www.peoplegroups.org".
- People-group data is read only from PeopleGroups.org. The IMB website terms at https://www.imb.org/website-terms-use/ forbid automated access to that website, so this project does not call it.
- No API keys belong in the repo. `.env.example` has placeholders only.

US state is not a field on the API. For groups in the United States, the library assigns a state in two ways. It tests the published latitude and longitude against US Census Bureau state boundaries (public domain, simplified by the [us-atlas](https://github.com/topojson/us-atlas) project; see `data/SOURCE.txt`). It also includes a state when the published location description names that state, so a community that the point places in Louisiana and the description also places in Texas can match both. The description text itself is not returned. This covers the 50 states and the District of Columbia. It does not cover US territories. It is a geographic approximation, not a roster of residents or churches.

The PeopleGroups.org docs page still shows short field names (`NmDisp`, `Ctry`). The live API, checked on 22 November 2026, returns longer names (`DisplayName`, `CountryName`). The client accepts both public names and drops the rest.

Our MIT license covers this code. It does not relicense IMB, Joshua Project, Bible Brain, Global Recordings Network, or unfoldingWord content. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## What this version can answer

- Unreached people groups in a country (`list_unreached_by_country`). Names, ISO alpha-3 codes, and alpha-2 codes all work. `GA` here is Gabon, and `CA` is Canada.
- Unreached people groups in a US state (`list_unreached_by_us_state`). `GA` here is Georgia, and `CA` is California.
- One people group by id (`get_people_group`), for example `PG012345`.
- People groups by ISO 639-3 / ROL code (`list_people_groups_by_language`), for example `ntm`.

Lists are sorted by population, 25 at a time, and can be paged with `limit` and `offset`.

## Run the server

```bash
npm install
npm start
```

`npm start` speaks MCP over stdio. Standard output is the protocol. Logs go to standard error. The process waits until a client connects.

Cursor, or any other MCP client that can launch a local process, can use:

```json
{
  "mcpServers": {
    "nations-next-door": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/nations-next-door"
    }
  }
}
```

To click through the tools without a chat client:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run smoke:imb
```

`npm test` does not touch the network. `npm run smoke:imb` calls the live PeopleGroups.org API and prints a few public records for Benin, Texas, PG012345, and language code `ntm`. Run it by hand. CI does not.

## Layout

| Path | Role |
| --- | --- |
| `src/core` | People-group queries, allowlist, state assignment. Import this from later units. |
| `src/server.ts` | MCP tool registration. Thin wrapper. |
| `src/index.ts` | stdio entry. |
| `scripts/smoke-imb.ts` | Manual live check. |
| `tests/fixtures` | Recorded responses. Sensitive values are sentinels. |
| `docs/PLAN.md` | Version 1, units 1–8. |
| `docs/DATA_SOURCES.md` | Access, keys, terms, attribution. |
| `docs/DESIGN.md` | Mira's design direction. Not built yet. |

## License

[MIT](LICENSE) for this code. Data terms are in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).
