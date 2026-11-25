# Data sources

Checked on 22 November 2026. "Verified" means the public page was fetched and the notes below match it. "Could not verify" means the page was missing, redirected without a readable body, or did not resolve from this environment. Do not treat a gap as permission.

This project stores no copy of these datasets. Unit 1 calls only PeopleGroups.org, and only the people-group record routes.

## IMB PeopleGroups.org

| | |
| --- | --- |
| What | Public people-group research from IMB Global Research. About 12,000 groups. |
| Access | `GET https://peoplegroups.org/wp-json/pg/v1/people-groups` and `GET /people-groups/{pgid}`. Documented at https://peoplegroups.org/using-the-api/. `country` takes an English name or an ISO alpha-3 code. `language` takes an ISO 639-3 / ROL code. This client does not send an engagement filter or a GSEC filter. |
| Key | No account and no key. |
| License / terms | The API page says the data is free and public. The API is a beta and may change without warning (https://peoplegroups.org/using-the-api/ and https://peoplegroups.org/downloads/). No formal published license for the people-group dataset was found. IMB website terms, which forbid automated access to the IMB website, are at https://www.imb.org/website-terms-use/. This project does not call the IMB website. It calls only the PeopleGroups.org API, which is published for that use. |
| Attribution to display | `This information was provided by The International Mission Board - Global Research, [Month Year], Nations Next Door, www.peoplegroups.org` |
| Used in unit 1 | Yes. Country, language, one group by PGID, and the US list that state assignment filters. |

### Verified on the live API

- No key is required. A sample request returned JSON.
- `X-WP-Total` was 12387 on 22 November 2026. `per_page` above 250 is clamped. `Cache-Control` included `max-age=600`. The in-memory cache defaults to that lifetime.
- The docs page's example uses short names (`NmDisp`, `Ctry`, `Pop`). The live record uses long names (`DisplayName`, `CountryName`, `Population`). The client accepts both public names.
- `country=USA` and `country=United%20States` return the same United States set (628 groups that day). Alpha-2 `US` is rejected. This project converts alpha-2 and common names to alpha-3 before calling.
- United States groups have distinct latitude and longitude, not one national centroid. State names in the location text are read and the text is discarded. It is not cached or returned.
- There is a `/people-groups/export` route. This project does not call it.

### Could not verify

- A current PeopleGroups.org terms page that states a formal license. The credit line follows the older Global Research FAQ pattern (month, publication name, www.peoplegroups.org), with "Nations Next Door" as the publication. The API page itself only says the data is free, public, and beta.
- A published rate limit. Only the beta warning and the cache header were found. Paging pauses 150 ms between requests and stops after 20 pages.

### Fields the client drops, and why

The normalizer copies an allowlist. These fields are not stored, cached, or returned:

| Field | Why it is dropped |
| --- | --- |
| `GSEC`, `GSECDescription`, `GSECLongDescription`, `GSECbrf`, `GSEClng` | The scale mixes evangelical share with church-planting activity. We keep only an unreached yes/no from the evangelical band. |
| `EngStat`, `EngagementStatus`, `EngagementProgress`, `EngagementProgressDesc`, `SPI`, `SPIdesc` | Engagement status. Not public aggregate data for this project. |
| `CongExst`, `CongregationsExist`, `Plnting`, `ChurchPlantingWithinLast2Years` | Congregation and church-planting details. |
| `LocationDesc`, `LocationDescription` | A location narrative can be more precise than a country. State names for the United States are read and the text is discarded. |
| `PicURL`, `PhotoURL`, `PicCrdt`, `PhotoCredit`, `HasPhoto` | People-group record photos are Joshua Project photos and cannot be reused here. |
| Worker, missionary, believer, and pejorative-name fields | Never in scope, whatever the key is called. |

Unreached is true only when the evangelical band says less than 2%. If that band is missing, unreached is null. GSEC is not a fallback.

In Open Doors World Watch List 2026 countries, latitude and longitude are rounded to one decimal degree (about 11 km) before they leave the normalizer. The list is public (https://www.opendoors.org/persecution/countries) and is not an IMB security field. The United States is not on it, so state points stay precise enough for the state boundaries.

### Routes this project does not call

`/stats` and `/countries` return engagement totals. `/people-groups/export` is a bulk download. The engagement and GSEC query parameters are not sent.

### IMB website

Automated access to the IMB website is prohibited by https://www.imb.org/website-terms-use/ ("any robot, spider, or other automatic device, process, or means to access the Website"). This project does not call that website. People-group reads go only to PeopleGroups.org.

## Joshua Project

| | |
| --- | --- |
| What | People-group, country, and language data. Optional in unit 3. |
| Access | REST API. Getting started: https://api.joshuaproject.net/getting_started. A request looks like `https://api.joshuaproject.net/v1/...json?api_key=...`. |
| Key | Free. The getting-started page says you request a key and verify an email. Self-hosters bring their own key. A key for the public site stays on the server and is never sent to the browser. The sample key on the getting-started page is not a real key. |
| License / terms | Verified at https://joshuaproject.net/help/terms and in the API terms PDF at https://api.joshuaproject.net/files/pdfs/joshua-project-API-terms-of-use.pdf. Free, non-commercial, revocable. No sale of the data, no commercial product, no use to generate revenue. Do not abuse the API. No warranty. They can end access, and cached data must then be deleted. |
| Attribution to display | `Data provided by Joshua Project` with a link to https://joshuaproject.net/ on every page and every chat answer that uses their data. |
| Used in unit 1 | No. The key is a step for Zach. |

### Replication limit

The terms forbid a public service that replicates Joshua Project or overlaps it heavily. Publishing their data is not, by itself, allowed. Unit 3 is a short status line beside the IMB record, and Zach decides whether that is enough before it is deployed.

Rules for that adapter:

- Short status lines only: name, population, language, religion, and their unreached yes or no.
- Drop `SecurityLevel` if it is present.
- No Joshua Project photos.
- No donation button on a page that shows their data.
- No prayer card built from their data or photos. Link to their profile instead.
- A purge-all-cache command deletes every cached Joshua Project response. Use it if they end access.

The terms also say not to reproduce substantial amounts of their data on other websites, and that linking is preferred. This project must not mirror their dataset.

### Could not verify

- Nothing material on the terms pages themselves. Both the HTML terms and the PDF were fetched. The PDF text extraction was a bit rough (missing glyphs in a few words) but the non-commercial, attribution, and no-replication rules were readable.

## Bible Brain (Faith Comes By Hearing)

| | |
| --- | --- |
| What | Bible text and audio (Digital Bible Platform / DBP) for unit 2. |
| Access | REST API. A developer key is required on requests. Key request form observed at https://4.dbt.io/api_key/request. Core concepts: https://www.faithcomesbyhearing.com/bible-brain/core-concepts. |
| Key | Yes. Faith Comes By Hearing approves or denies each request. The key is not shared and can be revoked. Zach requests it, describing this church project. |
| License / terms | Developer license, last modified 15 April 2021, verified at https://www.faithcomesbyhearing.com/bible-brain/license. End-user terms: https://www.faithcomesbyhearing.com/bible-brain/terms-conditions. Use here is website streaming only. End users get the content free. The key is not shareable. Do not proxy the content to other developers. Keep copyright notices and show their terms. Offline download only for content their download list marks as allowed. |
| Attribution to display | The copyright notice that comes with each Bible version, plus a link to the DBP terms (https://www.faithcomesbyhearing.com/bible-brain/terms-conditions). |
| Used in unit 1 | No. The adapter stays off until a key exists. Do not put Bible Brain content in the AI chat, on a printed card, or on a hosted MCP endpoint unless Faith Comes By Hearing has given written permission for that use. |

### Could not verify

- A single required attribution sentence beyond "keep the proprietary notices" and "give end users the DBP terms." The display line above is this project's summary, not a quote from the license.
- The current content-API hostname. The key form is on `4.dbt.io`. The license still points developers at digitalbibleplatform.com. Confirm the base URL from the docs that arrive with the key. Do not guess it into production.

## Global Recordings Network

| | |
| --- | --- |
| What | Gospel audio, video, scripts, and language data for unit 2. |
| Access | GraphQL API, described at https://globalrecordings.net/en/graphql-api. The page says the API is free for mission organizations, churches, Bible translation teams, Christian media distributors, and other digital ministries. Access is by application. The public page does not list the endpoint URL. GRN sends that with the key. |
| Key | Yes. A ministry applies. There is no self-serve key. Zach applies for Carpenters Way / Nations Next Door. |
| License / terms | Copyright page verified at https://globalrecordings.net/en/copyright. Unless a program says otherwise, audio, video, and scripts are CC BY-NC-SA. Attribute the source and do not benefit financially from the materials. Site terms at https://globalrecordings.net/en/terms-and-conditions require non-commercial use, attribution, and no modification of the content. This project does not modify GRN media and does not use GRN pictures. |
| Attribution to display | `Global Recordings Network, https://globalrecordings.net/. Licensed CC BY-NC-SA unless the program page says otherwise.` |
| Used in unit 1 | No. After an application is approved, the AI receives metadata and links only, not the media files. |

### Could not verify

- A GraphQL-specific contract beyond the apply page and the sitewide copyright and terms pages.
- The endpoint URL, which is not on the public page.
- How to reconcile "do not modify content" (terms page) with "you may adapt under CC BY-NC-SA" (copyright page). Until Zach confirms, this project links and plays GRN media and does not adapt it.

## unfoldingWord / Door43

| | |
| --- | --- |
| What | Open biblical resources (translation helps, Open Bible Stories, and other catalogued works) for unit 2. The first language-resource adapter, because it needs no key. |
| Access | `GET https://git.door43.org/api/v1/catalog/search`. Resource records carry a `rights` field. Linked files are mostly on `https://cdn.door43.org`. |
| Key | No. |
| License / terms | unfoldingWord's license page was verified at https://unfoldingword.org/about/license/. Content they create is CC BY-SA 4.0. Share and adapt, including commercially, with attribution and ShareAlike. The unfoldingWord name and logo are trademarks and are not part of that grant. The catalog's own `rights` value wins for each resource. Some entries are not unfoldingWord's. |
| Attribution to display | `Original work available at unfoldingWord.org.` Plus the license: https://creativecommons.org/licenses/by-sa/4.0/. Do not put the unfoldingWord trademark on a derivative. An AI paraphrase is a CC BY-SA adaptation: name the source, say it was changed, and license the paraphrase the same way. |
| Used in unit 1 | No. This is allowed on the hosted MCP endpoint, with the attribution above. |

### Could not verify

- `https://door43.org/en/legal/license` redirected and the body was not readable in the fetch used here.
- A live call to `https://git.door43.org/api/v1/catalog/search` from this environment. Re-check it when unit 2 starts. The older catalog document at https://api-info.readthedocs.io/en/latest/door43.html describes a v3 catalog and CC BY-SA `rights` values. This project will use the git.door43.org search URL above.

## Photos

Default to the warm pattern tile from [DESIGN.md](DESIGN.md). Use a photo only when the license is known.

- People-group record photo URLs are Joshua Project photos. Do not store or show them.
- IMB's own photo library is CC BY-NC 4.0 (https://www.imb.org/photos/terms-conditions/) and may be used with credit. Never use the Missionaries & Volunteers collection.
- Restricted-access countries (Open Doors World Watch List 2026) always use the pattern tile, not a photo.
- No Joshua Project photos. No GRN pictures.

## US Census state boundaries

Not a people-group source. Used only to test whether a published latitude and longitude falls inside a state.

US Census Bureau cartographic boundaries, simplified, via the us-atlas project (`states-10m.json`, version 3.0.1). The boundary data is in the public domain. See `data/SOURCE.txt`. The file in this repo is the 50 states and the District of Columbia. It is not a people-group extract.

## ISO 3166 country codes

`src/core/data/iso3166.json` is a name and code lookup so "US" and "Turkey" can be sent as alpha-3 codes the PeopleGroups.org API accepts. It is not an IMB dataset. Country names follow ISO 3166-1 English short names.

## Secrets

No source in this file is shipped with a real key. Placeholders are in `.env.example`. Asking IMB, Joshua Project, Bible Brain, or Global Recordings Network for access is a step for Zach, written in [PLAN.md](PLAN.md).
