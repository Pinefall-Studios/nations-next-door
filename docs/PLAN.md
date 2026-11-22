# Nations Next Door — version 1 plan

Nations Next Door answers one question for a church: who is unreached in my state or country, and what free resources exist in their language? It uses public data only. It is free and non-commercial. The first pilot users are the missions team at Carpenters Way Church in Lufkin, Texas.

The finished v1 has an MCP server, a one-page site, and printable prayer cards. This document splits that work into eight units. Unit 1 is this repository's current code. Later units are not built yet.

The design direction for the site, the chat, and the prayer cards is [DESIGN.md](DESIGN.md), from Mira (22 November 2026). Mira signs off on the design before any UI pull request merges.

## How the code is split

`src/core` is the data library. It talks to PeopleGroups.org, keeps the allowlist, assigns US states, and returns public records with attribution. `src/server.ts` registers MCP tools that call `createPeopleGroupsService()`. Units 5 and 6 import that same function. They do not keep a second copy of the queries, and they do not scrape the MCP process.

```ts
import { createPeopleGroupsService } from "./src/core/index.ts";

const peopleGroups = createPeopleGroupsService();
const texas = await peopleGroups.listUnreachedByUsState({ state: "TX", limit: 25 });
```

## Data ethics

These rules apply to every unit, including the chat agent.

- Public, aggregate data only. A people group has a name, a population, a primary language and code, a religion, a reached or unreached status, and a GSEC number. Coordinates and a US state assignment are public geography. A short public description and IMB's coarse Scripture-availability notes are included. That is the shape of a record.
- Never request, store, log, or show field workers, missionaries, local believers, congregations, or engagement details for restricted-access places. The PeopleGroups.org payload includes engagement and church-planting fields. The client drops them with an allowlist in `src/core/project.ts`. It does not call the export route, the stats route, the countries route, or the `engagement` filter. Those routes and that filter are about engagement totals or bulk download.
- If IMB and a later source disagree, show both and name each source. Do not invent a merged number.
- Do not bulk-mirror or redistribute a provider's dataset. Fetch the slice a question needs. Cache it in memory for a short time (10 minutes by default, aligned with the API's cache header). Do not write the cache to disk. Do not commit fixtures that contain real engagement values or secrets. Tests use sentinels.
- Keep the project free and non-commercial. Attribute every source on every answer, card, and page. The MIT license on this code does not relicense anyone else's data.
- No real API keys in the repo, commits, fixtures, or logs. `.env.example` is placeholders. Keys that have to be requested are a step for Zach, listed at the end of this plan. Do not contact IMB, Joshua Project, Bible Brain, or Global Recordings Network from a pull request.
- The chat agent in unit 6 uses the same library and the same rules. It cites the source of every fact. If someone asks about workers, believers, or restricted-access engagement, it refuses. It does not guess.

"Unreached" in this project means less than 2% evangelical, which is IMB's definition. GSEC levels 0–3 are that band when the evangelical text is missing. The GSEC number is returned. The GSEC narrative is not, because it mixes in church-planting activity.

## Unit 1 — Foundation and IMB tools

This unit. Status: in review.

### Scope

- Repository scaffold: TypeScript, the MCP SDK v2 server package, MIT license, contributing guide, CI (lint, typecheck, tests), and `.env.example` with placeholders only.
- This plan, the data-source notes, and Mira's design direction checked in for later units.
- A core library and a thin MCP server.
- PeopleGroups.org client with four tools: unreached by country, unreached by US state, one group by PGID, and groups by ISO 639-3 / ROL code.
- Recorded fixtures and a manual live smoke script.

### Acceptance criteria

- CI runs lint, typecheck, and tests, and the tests do not call a live API.
- `npm start` serves the MCP server over stdio, and the README shows a client config.
- The four tools return public fields and the IMB credit line. A test proves engagement, worker, believer, photo, and location-narrative values are stripped.
- US state uses the point and the location description, as described above, and the description text is not in the output.
- `npm run smoke:imb` returns live PeopleGroups.org data for a country, a US state, one group, and a language code.
- `src/core` does not import the MCP SDK.
- No website, chat UI, or prayer card is in this unit.

### Data sources and licenses

IMB PeopleGroups.org public beta API. No key. Credit IMB Global Research. Details and the things we could not verify are in [DATA_SOURCES.md](DATA_SOURCES.md). The separate API at api.imb.org is documented there and is not called.

## Unit 2 — Language-resource linking

### Scope

Given a people group's ISO 639-3 code, find free resources in that language. Build this in the core library, then add thin MCP tools. The site and the chat agent call the same functions.

- unfoldingWord / Door43 first. The catalog at `https://api.door43.org/v3/catalog.json` needs no key. Match the language code and return titles, formats, and links, each with the `rights` value from the catalog.
- Bible Brain and Global Recordings Network adapters exist in the code but stay off until the matching environment variable is a non-empty key. While the key is blank they make no network call and the tool says the source is not configured.
- Do not proxy Bible Brain content for other developers. End users receive it free, inside this project, with the content licensor's notices and a link to the Bible Brain terms.
- Do not download GRN media into the repo. Link or play it under their terms.

### Acceptance criteria

- A language code returns unfoldingWord resources from a fixture in CI, with CC BY-SA attribution and a link to the license.
- Bible Brain and GRN tools report that they are off when the keys are blank, and the test asserts they do not call `fetch`.
- With a key present (Zach's machine, not CI), each configured adapter returns a small public result and its attribution. CI still uses fixtures.
- No people-group engagement fields are added by this unit.

### Data sources and licenses

- unfoldingWord / Door43. Catalog needs no key. Content is CC BY-SA 4.0 unless a catalog entry says otherwise. Attribution: "Original work available at unfoldingWord.org." Share adaptations under the same license. unfoldingWord is a trademark; do not put it on a derivative.
- Bible Brain (Faith Comes By Hearing). Key approved case by case. Content must reach end users free. No proxy for other developers. Keep proprietary notices. Zach requests the key.
- Global Recordings Network. GraphQL API. Ministries apply. Audio, video, and scripts are CC BY-NC-SA unless a page says otherwise. Attribute Global Recordings Network and link https://globalrecordings.net/. Their sitewide terms also say site content must not be modified. This project links and plays. It does not adapt GRN media until Zach confirms that is allowed.

## Unit 3 — Optional Joshua Project adapter

### Scope

An adapter in the core library, off unless `JOSHUA_PROJECT_API_KEY` is set. It can add Joshua Project's public people-group fields beside the IMB record for the same group: name, population, language, religion, and their reached status. It is a comparison, not a second copy of their product.

- No bulk download and no local mirror.
- Do not rebuild Joshua Project's site, daily unreached list, or general people-group browser out of their data. The value this project adds is the state view, the language-resource links, and the church workflow.
- If IMB and Joshua Project disagree, show both figures and both credits. [DESIGN.md](DESIGN.md) asks for that on the people-group card.

### Acceptance criteria

- With no key, the tool says the adapter is off and does not call the network.
- With a fixture, a group can show both sources, each with its attribution.
- The public allowlist still drops engagement and worker fields if Joshua Project returns them.
- Zach has read the no-replication term before any public page that uses this adapter is deployed.

### Data sources and licenses

Joshua Project API. Free key, email verification, non-commercial only. Attribution text to display, with a link: "Data provided by Joshua Project" pointing at https://joshuaproject.net/. No selling the data, no commercial product, no highly overlapping public service. Zach requests the key. Do not request it from this repository's automation.

## Unit 4 — Design direction and design system

### Scope

Turn [DESIGN.md](DESIGN.md) into a design system the site can use: paper, ink, and ember colors; Fraunces, Inter, and Noto; the map rules; the people-group card; the chat; the prayer card. Beauty is part of the work, not a later polish pass. The mood is a warm, reverent, modern missions atlas, mobile-first.

This unit can add tokens and written component rules. It does not build the one-page site, the chat, or the prayer-card file.

### Acceptance criteria

- The tokens match [DESIGN.md](DESIGN.md): Fraunces for people-group names, Inter for UI, Noto for native scripts, the paper and ember palette, and the map colors.
- Mira signs off on the design before any UI pull request merges.
- No production page is deployed from this unit.

### Data sources and licenses

None. This unit does not fetch people-group data. Photos, when a later unit shows them, need a license and a credit, or they are replaced by the warm pattern tile in the design direction. Unit 1 does not pass photo URLs through.

## Unit 5 — One-page site

### Scope

A mobile-first page on the unit 4 design system and [DESIGN.md](DESIGN.md). A person can look up a state or country, see a calm map, open a people group, and find the next step (pray, or resources). The map is a single-hue ember choropleth. Tapping a region opens a list, largest group first. The page always shows the data source.

The page imports `createPeopleGroupsService` from `src/core`. It does not reimplement filters.

### Acceptance criteria

- The main flow works on a phone-width and a desktop-width browser: choose Texas, see unreached groups, open one, see language and the IMB credit.
- The map and the list agree. Empty and error states are visible and plain.
- Native names, when a source provides them, render in their own script.
- View source shows no API keys. The page does not offer worker, believer, or engagement details.
- Mira's sign-off from unit 4 is already recorded.

### Data sources and licenses

IMB PeopleGroups.org, plus whatever unit 2 (and unit 3, if the key exists) already return through the core library. Each block on the page carries the attribution from [DATA_SOURCES.md](DATA_SOURCES.md).

## Unit 6 — AI chat on the site

### Scope

A chat on the same page, specified in [DESIGN.md](DESIGN.md): a careful librarian, no sparkle icon, no "AI" badge, three plain suggested questions, short answers, inline citations, and the matching people-group cards so someone can pray or open resources.

Suggested stack: the Vercel AI SDK with the Vercel AI Gateway. The model calls the same core functions the MCP tools call. It does not get a private copy of the data. Every fact names its source (IMB, and later Joshua Project, unfoldingWord, Bible Brain, or GRN). If the data does not know, the answer says so.

The agent refuses questions about field workers, missionaries, local believers, congregations, or engagement in restricted-access places. The refusal is a product behavior, with a test.

No real model key in the repo. `AI_GATEWAY_API_KEY` stays blank in `.env.example` and is set in the host's secret store. The public endpoint is rate limited (`CHAT_RATE_LIMIT_PER_MINUTE`) so the free site cannot be used as an open proxy.

### Acceptance criteria

- "Who is unreached in Texas and what resources exist in their language?" returns groups from the core library, resource links from unit 2 when those adapters are on, and a citation on each fact.
- A question about workers or believers is refused, and the test shows that no tool result about workers is requested.
- Rate limiting rejects a burst over the configured limit.
- CI does not call a live model. Tests use a fake model or recorded tool traces.
- The chat matches the paper, type, and layout in [DESIGN.md](DESIGN.md).

### Data sources and licenses

The same sources as units 1–3. The model is not a source. Citations point at the data providers, not at the model.

## Unit 7 — Printable prayer cards

### Scope

A 4×6 inch card and a 2-up US Letter sheet, as specified in [DESIGN.md](DESIGN.md), including 0.125 inch bleed, margins of at least 0.375 inch, and body type of at least 10 points. Cards work in black and white. Front: pattern tile or a licensed photo with credit, name, native name, country, population, Revelation 7:9. Back: three short prayer points, language, resources, a QR code to the group page, and a footer with the source, the data date, and a small Nations Next Door mark.

Prayer points are written from the public record only. They do not mention workers, believers, or engagement.

### Acceptance criteria

- A sample card for one unreached group prints cleanly in color and in black and white.
- The footer quotes the source attribution and the record's data date.
- The QR code opens that group's page from unit 5.
- The layout matches [DESIGN.md](DESIGN.md).

### Data sources and licenses

The card's facts use the same core record and the same attributions. Revelation 7:9 should be a public-domain translation or a text the project has a right to print. Do not paste a copyrighted Bible translation onto the card.

## Unit 8 — Pilot polish and deploy

### Scope

Prepare the Lufkin pilot. Exercise the real path a missions team member will use: Texas, one people group, resources, a prayer card, and one chat question. Fix empty states, errors, and mobile layout. Deploy the site. Vercel is the suggested host because unit 6 uses the Vercel AI SDK and AI Gateway. Zach can choose another host if it can keep the model key out of the repo and enforce the rate limit.

Do not turn the deploy into a bulk copy of any provider's data. The server still fetches live, with the same in-memory cache.

### Acceptance criteria

- A person who is not the author can open the deployed site on a phone, find unreached groups in Texas, open one, and see the IMB credit without creating an account.
- The chat cites sources and refuses a worker question.
- Secrets are only in the host's environment. The repository and the client bundle contain none.
- Logs do not contain raw provider payloads.
- Carpenters Way's missions team can use the pilot. Feedback is written down before calling the pilot done.

### Data sources and licenses

No new sources. Re-check [DATA_SOURCES.md](DATA_SOURCES.md) before launch in case a provider has changed terms. PeopleGroups.org is a beta API and may change without warning.

## Steps for Zach

These need a person. They are not part of unit 1, and they should not be done by an automated pull request.

1. Review and merge unit 1.
2. Before unit 2 uses Bible Brain, request a key from Faith Comes By Hearing. Describe a free, non-commercial church tool that shows content to end users and does not proxy it to other developers. Apply to Global Recordings Network as a church for the GraphQL API. Door43 needs no key.
3. Before unit 3, request a Joshua Project API key and read their no-replication term. Decide whether a side-by-side comparison is enough value-add to publish.
4. Ask Mira to sign off on the design before any UI pull request merges.
5. Put real keys only in the host's secret store. Leave `.env.example` blank.
