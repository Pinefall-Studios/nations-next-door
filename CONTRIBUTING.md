# Contributing

Nations Next Door is a free, non-commercial tool for churches. The code in this repository is MIT. The people-group data and the Scripture resources it will cite are not. Their terms still apply. Read [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) and the data-ethics section of [docs/PLAN.md](docs/PLAN.md) before adding a source.

## Local checks

```bash
npm install
npm run lint
npm run typecheck
npm test
```

`npm test` uses recorded fixtures. It must not call PeopleGroups.org or any other network API. A setup file replaces `fetch` and fails the run if something tries. The manual live check is separate:

```bash
npm run smoke:imb
```

Do not add that script to CI.

## Data rules

- Return public, aggregate fields only: name, population, language and code, religion, reached or unreached status, GSEC, and the other fields on the allowlist in `src/core/project.ts`.
- Do not request, store, log, or return field workers, missionaries, local believers, congregations, or engagement details. If a payload contains them, the allowlist drops them. Add a test when a new sensitive field shows up.
- Do not bulk-download or commit a provider's dataset. Fixtures are small, and sensitive values in them are sentinels.
- Do not commit API keys, `.env`, or real tokens. `.env.example` stays placeholders.
- Attribute every source in the tool or page that shows its data.

## Design

Do not open a UI pull request until Mira signs off on the design. The direction is [docs/DESIGN.md](docs/DESIGN.md). Unit 4 in the plan is the design system. Units 5 through 7 build the site, the chat, and the prayer cards on that direction.

## Pull requests

Branch from `main`. Keep the data layer in `src/core`. The MCP server, the future site, and the future chat agent should call those functions rather than copy them. Zach reviews and merges.
