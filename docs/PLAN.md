# Nations Next Door — version 1 plan

Nations Next Door answers one question for a church: who is unreached in my state or country, and what free resources exist in their language? It uses public data only. It is free and non-commercial. The first pilot users are the missions team at Carpenters Way Church in Lufkin, Texas.

The finished v1 has an MCP server, a one-page site, and printable prayer cards. This document splits that work into eight units. Unit 1 is this repository's current code. Later units are not built yet.

The design direction for the site, the chat, and the prayer cards is [DESIGN.md](DESIGN.md), from Mira (22 November 2026). Mira signs off on the design before any UI pull request merges. The explore map and librarian in `apps/web` follow the Interactive map and librarian section of that document.

## How the code is split

`src/core` is the data library. It talks to PeopleGroups.org, keeps the allowlist, assigns US states, and returns public records with attribution. `src/server.ts` registers MCP tools that call `createPeopleGroupsService()`. Units 5 and 6 import that same function. They do not keep a second copy of the queries, and they do not scrape the MCP process.

```ts
import { createPeopleGroupsService } from "./src/core/index.ts";

const peopleGroups = createPeopleGroupsService();
const texas = await peopleGroups.listUnreachedByUsState({ state: "TX", limit: 25 });
```

## Data ethics

These rules apply to every unit, including the chat agent.

- Public, aggregate data only. A people group has a name, a population, a primary language and code, a religion, an unreached yes or no, and an evangelical percentage band. Coordinates and a US state assignment are public geography. In Open Doors World Watch List 2026 countries, coordinates are rounded to one decimal degree before they are returned. A short public description and IMB's coarse Scripture-availability notes are included. That is the shape of a record.
- Never request, store, log, or show GSEC, photos from the people-group record, location narratives, field workers, missionaries, local believers, congregations, or engagement details. The PeopleGroups.org payload includes those fields. The client drops them with an allowlist in `src/core/project.ts` before anything is cached or returned. It does not call the export route, the stats route, the countries route, or the `engagement` or `gsec` filters. Unreached is computed only from the evangelical band (less than 2%). GSEC is not a fallback.
- If IMB and a later source disagree, show both and name each source. Do not invent a merged number.
- Do not bulk-mirror or redistribute a provider's dataset. Fetch the slice a question needs. Cache it in memory for a short time (10 minutes by default, aligned with the API's cache header). Do not write the cache to disk. Do not commit fixtures that contain real engagement values or secrets. Tests use sentinels.
- Keep the project free and non-commercial. Attribute every source on every answer, card, and page. The MIT license on this code does not relicense anyone else's data.
- No real API keys in the repo, commits, fixtures, or logs. `.env.example` is placeholders. Keys that have to be requested are a step for Zach, listed at the end of this plan. Do not contact IMB, Joshua Project, Bible Brain, or Global Recordings Network from a pull request.
- The chat agent in unit 6 uses the same library and the same rules. It cites the source of every fact. If someone asks about workers, believers, or restricted-access engagement, it refuses. It does not guess.

"Unreached" in this project means less than 2% evangelical, which is IMB's definition, read from the evangelical band only. If that band is missing, `unreached` is null. It is not guessed.

People-group facts come only from PeopleGroups.org. The IMB website terms at https://www.imb.org/website-terms-use/ forbid automated access to the IMB website, so this project does not call that website or any API hosted there.

A hosted MCP endpoint, when one exists, serves IMB PeopleGroups data and unfoldingWord only. It does not serve Bible Brain, Global Recordings Network, or Joshua Project.

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
- The four tools return public fields and the IMB credit line, with the month and year filled in. A test proves GSEC, engagement, worker, believer, photo, and location-narrative values are stripped. Committed fixtures do not contain those fields.
- US state uses the point and the location description, as described above, and the description text is not in the output.
- `npm run smoke:imb` returns live PeopleGroups.org data for a country, a US state, one group, and a language code.
- `src/core` does not import the MCP SDK.
- No website, chat UI, or prayer card is in this unit.

### Data sources and licenses

IMB PeopleGroups.org public beta API only. No key. No formal published license was found; the API page calls it a public beta. Credit line: "This information was provided by The International Mission Board - Global Research, [Month Year], Nations Next Door, www.peoplegroups.org". Details are in [DATA_SOURCES.md](DATA_SOURCES.md).

## Unit 2 — Language-resource linking

### Scope

Given a people group's ISO 639-3 code, find free resources in that language. Build this in the core library, then add thin MCP tools. The site and the chat agent call the same functions.

- unfoldingWord / Door43 first. Search the catalog at `https://git.door43.org/api/v1/catalog/search`. It needs no key. Match the language code and return titles and links, each with the catalog `rights` value and CC BY-SA attribution. unfoldingWord is a trademark; do not put it on a derivative. An AI paraphrase of unfoldingWord text is a CC BY-SA adaptation: attribute it, say it was changed, and license the paraphrase the same way.
- Bible Brain stays off until Zach has a key, and even then it is website streaming only. Show the copyright notice and their terms with the stream. The key is not shareable and must not be used to proxy content to other developers. Do not put Bible Brain content in the AI chat, on printed cards, or on a hosted MCP endpoint unless Faith Comes By Hearing has given written permission for that use.
- Global Recordings Network stays off until their API application is approved. After that, pass the AI metadata and links only. Do not modify GRN media. Do not use GRN pictures. Audio and scripts stay CC BY-NC-SA.

### Acceptance criteria

- A language code returns unfoldingWord resources from a fixture in CI, with CC BY-SA attribution and a link to the license. The catalog host is `git.door43.org`.
- Bible Brain and GRN tools report that they are off when the keys are blank, and the test asserts they do not call `fetch`.
- With a key present (Zach's machine, not CI), Bible Brain returns a stream for the website only, with the copyright notice. GRN returns metadata and a link, not a file and not a picture.
- The chat and the hosted MCP endpoint do not receive Bible Brain content unless written permission is on file.
- No GSEC, engagement, or photo fields are added by this unit.

### Data sources and licenses

- unfoldingWord / Door43. Catalog search at `https://git.door43.org/api/v1/catalog/search`. No key. CC BY-SA 4.0 unless a catalog entry says otherwise. Attribution: "Original work available at unfoldingWord.org." Share adaptations, including AI paraphrases, under the same license. unfoldingWord is a trademark.
- Bible Brain. Website streaming only, with copyright notices and their terms. Key is not shareable. No proxy. No AI chat, printed card, or hosted MCP use without written permission.
- Global Recordings Network. CC BY-NC-SA, and only after the API application is approved. No modification. No GRN pictures. The AI gets metadata and links only.

## Unit 3 — Optional Joshua Project adapter

### Scope

An adapter in the core library, off unless `JOSHUA_PROJECT_API_KEY` is set. It can add a short Joshua Project status line beside the IMB record for the same group: name, population, language, religion, and whether they count the group as unreached. It is a comparison, not a second copy of their product.

- No bulk download and no local mirror. Self-hosters bring their own key. A site-wide key stays on the server and is never sent to the browser.
- Every page and every chat answer that uses their data shows "Data provided by Joshua Project" with a link to https://joshuaproject.net/.
- Status lines stay short. Drop `SecurityLevel` if the payload includes it. Do not show Joshua Project photos. Do not put a donation button on a page that uses their data.
- Prayer cards are not built from Joshua Project data or photos. A card can link to Joshua Project's own profile instead.
- Provide a purge-all-cache command that deletes every cached Joshua Project response. Run it if they end access, and do not keep a copy.
- Do not rebuild Joshua Project's site, daily unreached list, or general people-group browser out of their data. The value this project adds is the state view, the language-resource links, and the church workflow.
- If IMB and Joshua Project disagree, show both figures and both credits. [DESIGN.md](DESIGN.md) asks for that on the people-group card.

### Acceptance criteria

- With no key, the tool says the adapter is off and does not call the network.
- With a fixture, a group can show both sources. The Joshua Project line is short, credited, and has no photo and no `SecurityLevel`.
- `clearCache` or the purge command removes Joshua Project responses, and a test proves a later call does not reuse them.
- Prayer-card code does not read Joshua Project fields.
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

None. This unit does not fetch people-group data. The pattern tile is the default. IMB's own photo library (CC BY-NC 4.0, with credit) is the only photo source later units may add, and never the Missionaries & Volunteers collection. Restricted-access countries always use the pattern tile. Unit 1 does not pass photo URLs through.

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

Suggested stack: the Vercel AI SDK with the Vercel AI Gateway, using a provider that does not train on the prompts and does not retain them. Do not store chat logs tied to a person. The model calls the same core functions the MCP tools call. It does not get a private copy of the data. Every fact names its source. If the data does not know, the answer says so.

The agent may see IMB people-group fields and unfoldingWord links. Global Recordings Network, if approved, is metadata and links only. Bible Brain audio and text stay out of the chat unless Faith Comes By Hearing has given written permission. Joshua Project, if the key is set, is a short credited status line and nothing else.

The agent refuses questions about field workers, missionaries, local believers, congregations, or engagement in restricted-access places. The refusal is a product behavior, with a test. It also refuses to invent a GSEC level.

A hosted MCP endpoint serves IMB PeopleGroups data and unfoldingWord only.

No real model key in the repo. `AI_GATEWAY_API_KEY` stays blank in `.env.example` and is set in the host's secret store. The public endpoint is rate limited (`CHAT_RATE_LIMIT_PER_MINUTE`) so the free site cannot be used as an open proxy. An unfoldingWord paraphrase in an answer is labeled as a CC BY-SA adaptation.

### Acceptance criteria

- "Who is unreached in Texas and what resources exist in their language?" returns groups from the core library, unfoldingWord links, and a citation on each fact. Bible Brain text is not in the prompt.
- A question about workers, believers, or GSEC is refused, and the test shows that no such field is requested.
- The provider configuration is no-training and no-retention, and the app does not write a transcript keyed to a user.
- Rate limiting rejects a burst over the configured limit.
- CI does not call a live model. Tests use a fake model or recorded tool traces.
- The chat matches the paper, type, and layout in [DESIGN.md](DESIGN.md).

### Data sources and licenses

The same sources as units 1–3. The model is not a source. Citations point at the data providers, not at the model.

## Unit 7 — Printable prayer cards

### Scope

A 4×6 inch card and a 2-up US Letter sheet, as specified in [DESIGN.md](DESIGN.md), including 0.125 inch bleed, margins of at least 0.375 inch, and body type of at least 10 points. Cards work in black and white. Front: the pattern tile by default, name, native name, country, population, and Revelation 7:9 from a public-domain World English Bible text. Back: three short prayer points from the IMB public record only, language, unfoldingWord links, a QR code to the group page, and a footer with the IMB credit, the data date, and a small Nations Next Door mark.

Do not build cards from Joshua Project data or photos. If a Joshua Project profile would help, link to theirs. Do not print Bible Brain text or audio without their written permission. Do not print GRN pictures. Do not use a photo from the people-group record (those URLs are Joshua Project photos). IMB's own photo library is CC BY-NC 4.0 and may be used with credit, except the Missionaries & Volunteers collection, which is never used. Restricted-access countries always use the pattern tile, not a photo.

Prayer points do not mention workers, believers, engagement, or GSEC.

### Acceptance criteria

- A sample card for one unreached group prints cleanly in color and in black and white.
- The footer quotes the IMB attribution and the record's data date. The verse is World English Bible.
- The card has no Joshua Project facts, no Joshua Project photo, and no Bible Brain text.
- A restricted-access country uses the pattern tile.
- The QR code opens that group's page from unit 5.
- The layout matches [DESIGN.md](DESIGN.md).

### Data sources and licenses

IMB PeopleGroups public fields, plus unfoldingWord links. Revelation 7:9 is the public-domain World English Bible. Joshua Project is not a source for the card.

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
