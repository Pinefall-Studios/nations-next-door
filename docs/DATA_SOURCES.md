# Data sources

Checked on 22 November 2026. "Verified" means the public page was fetched and the notes below match it. "Could not verify" means the page was missing, redirected without a readable body, or did not resolve from this environment. Do not treat a gap as permission.

This project stores no copy of these datasets. Unit 1 calls only PeopleGroups.org, and only the people-group record routes.

## IMB PeopleGroups.org

| | |
| --- | --- |
| What | Public people-group research from IMB Global Research. About 12,000 groups. |
| Access | `GET https://peoplegroups.org/wp-json/pg/v1/people-groups` and `GET /people-groups/{pgid}`. Documented at https://peoplegroups.org/using-the-api/. The live route index at https://peoplegroups.org/wp-json/pg/v1 also accepts `country`, `language`, `gsec`, and a bounding box. `country` takes an English name or an ISO alpha-3 code. `language` takes an ISO 639-3 / ROL code. |
| Key | No account and no key. |
| License / terms | The API page says the data is free and public, the API is beta, and it may change without warning. The downloads page repeats the beta warning: https://peoplegroups.org/downloads/. Definitions of unreached (less than 2% evangelical) and GSEC are at https://peoplegroups.org/definitions/. A December 2024 GSEC overview PDF on the same site treats levels 0–3 as the unreached band. |
| Attribution to display | `This information was provided by The International Mission Board - Global Research, PeopleGroups.org, https://peoplegroups.org/.` |
| Used in unit 1 | Yes. Country, language, one group by PGID, and the US list that state assignment filters. |

### Verified on the live API

- No key is required. A sample request returned JSON.
- `X-WP-Total` was 12387 on 22 November 2026. `per_page` above 250 is clamped. `Cache-Control` included `max-age=600`. The in-memory cache defaults to that lifetime.
- The docs page's example uses short names (`NmDisp`, `Ctry`, `Pop`, `EngStat`). The live record uses long names (`DisplayName`, `CountryName`, `Population`, `EngagementStatus`). The client accepts both and allowlists the public ones.
- `country=USA` and `country=United%20States` return the same United States set (628 groups that day). Alpha-2 `US` is rejected. This project converts alpha-2 and common names to alpha-3 before calling.
- United States groups have distinct latitude and longitude, not one national centroid. `LocationDescription` sometimes names states and counties. State assignment uses the point plus state names in that text. The text is not returned.
- There is a `/people-groups/export` route. This project does not call it.

### Could not verify

- A current terms-of-use page on peoplegroups.org that repeats the credit sentence. The sentence is taken from the older Global Research FAQ at https://peoplegroups.azurewebsites.net/294.aspx ("This information was provided by The International Mission Board - Global Research, Month 20XX, name of publication, www.peoplegroups.org."). The current About and Definitions pages name IMB Global Research as the source but do not repeat that sentence. Map PDFs say "Data by Global Research, IMB."
- A published rate limit. Only the beta warning and the cache header were found. Paging pauses 150 ms between requests and stops after 20 pages.
- Whether any Creative Commons license covers the people-group dataset. IMB's photo terms at https://www.imb.org/photos/terms-conditions/ are CC BY-NC 4.0 for those photos. That page is about photos. This project does not display the photo fields.

### Fields the client drops

The live record includes `EngagementStatus`, `EngagementProgress`, `EngagementProgressDesc`, `CongregationsExist`, `ChurchPlantingWithinLast2Years`, `GSECDescription`, `GSECLongDescription`, `LocationDescription`, `PejorativeAltNames`, and photo fields. The allowlist does not copy them. GSEC is returned as a number from 0 to 6 only. Worker, missionary, and believer keys are not copied even if a future response adds them. Tests cover this.

### Routes this project does not call

`/stats` and `/countries` return engagement totals (`total_uupgs`, `total_eupgs`, and similar). `/people-groups/export` is a bulk download. The `engagement` query parameter filters by engagement code. None of these are used.

## IMB public API at api.imb.org

| | |
| --- | --- |
| What | A separate, older IMB content API. People-group routes are listed at https://api.imb.org/Help. |
| Access | `https://api.imb.org/main/PeopleGroups/...`, including detail by PEID and minimal detail by country. |
| Key | No key is documented on the help pages that were fetched. |
| License / terms | The homepage (version 1.13.000) says use is limited by IMB's terms and can change without notice: https://api.imb.org/. |
| Attribution to display | Same IMB Global Research credit as PeopleGroups.org, if this API is ever used. |
| Used in unit 1 | No. |

### Could not verify

- The terms document itself. `https://www.imb.org/terms-and-conditions/` returned 404. The help pages list `EngStat` and `SPI` on the full detail record. If a later unit calls this API, it must use the same allowlist and drop those fields.
- Other sections on that host (Opportunities, Prayer) were not reviewed. Do not call them without reading their terms first.

## Joshua Project

| | |
| --- | --- |
| What | People-group, country, and language data. Optional in unit 3. |
| Access | REST API. Getting started: https://api.joshuaproject.net/getting_started. A request looks like `https://api.joshuaproject.net/v1/...json?api_key=...`. |
| Key | Free. The getting-started page says you request a key and verify an email. More than one key is allowed. The sample key on that page is not a real key. |
| License / terms | Verified at https://joshuaproject.net/help/terms and in the API terms PDF at https://api.joshuaproject.net/files/pdfs/joshua-project-API-terms-of-use.pdf. Free, non-commercial, revocable. No sale of the data, no commercial product, no use to generate revenue. Do not abuse the API. No warranty. They can end access, and cached data must then be deleted. |
| Attribution to display | `Data provided by Joshua Project` with a link to https://joshuaproject.net/. The terms say the credit appears on any page that shows their content, clearly enough that they could ask for a change. |
| Used in unit 1 | No. The key is a step for Zach. |

### Replication limit

The terms forbid a public service that replicates Joshua Project or overlaps it heavily. Publishing their data is not, by itself, allowed. Unit 3 is a side-by-side comparison inside a state-and-language tool, and Zach decides whether that is enough before it is deployed.

The terms also say not to reproduce substantial amounts of their data on other websites, and that linking is preferred. This project must not mirror their dataset.

### Could not verify

- Nothing material on the terms pages themselves. Both the HTML terms and the PDF were fetched. The PDF text extraction was a bit rough (missing glyphs in a few words) but the non-commercial, attribution, and no-replication rules were readable.

## Bible Brain (Faith Comes By Hearing)

| | |
| --- | --- |
| What | Bible text and audio (Digital Bible Platform / DBP) for unit 2. |
| Access | REST API. A developer key is required on requests. Key request form observed at https://4.dbt.io/api_key/request. Core concepts: https://www.faithcomesbyhearing.com/bible-brain/core-concepts. |
| Key | Yes. Faith Comes By Hearing approves or denies each request. The key is not shared and can be revoked. Zach requests it, describing this church project. |
| License / terms | Developer license, last modified 15 April 2021, verified at https://www.faithcomesbyhearing.com/bible-brain/license. End-user terms: https://www.faithcomesbyhearing.com/bible-brain/terms-conditions. Summary of the rules that bind this project: end users get the content completely free; do not build a proxy so other developers can pull content through us; keep proprietary notices; give end users the DBP terms; offline download only for content the `/download` list marks as allowed. |
| Attribution to display | Keep the copyright notice that comes with each Bible version, and link the DBP terms (https://www.faithcomesbyhearing.com/bible-brain/terms-conditions). Also show: `Scripture from Bible Brain / Faith Comes By Hearing. Free for end users.` |
| Used in unit 1 | No. The adapter stays off until a key exists. |

### Could not verify

- A single required attribution sentence beyond "keep the proprietary notices" and "give end users the DBP terms." The display line above is this project's summary, not a quote from the license.
- The current content-API hostname. The key form is on `4.dbt.io`. The license still points developers at digitalbibleplatform.com. Confirm the base URL from the docs that arrive with the key. Do not guess it into production.

## Global Recordings Network

| | |
| --- | --- |
| What | Gospel audio, video, scripts, and language data for unit 2. |
| Access | GraphQL API, described at https://globalrecordings.net/en/graphql-api. The page says the API is free for mission organizations, churches, Bible translation teams, Christian media distributors, and other digital ministries. Access is by application. The public page does not list the endpoint URL. GRN sends that with the key. |
| Key | Yes. A ministry applies. There is no self-serve key. Zach applies for Carpenters Way / Nations Next Door. |
| License / terms | Copyright page verified at https://globalrecordings.net/en/copyright. Unless a program says otherwise, audio, video, and scripts are Creative Commons Attribution-NonCommercial-ShareAlike. Attribute the source, do not benefit financially from the materials, and license adaptations the same way. A reasonable charge for blank media is allowed. Higher-resolution pictures need permission. Site terms verified at https://globalrecordings.net/en/terms-and-conditions: non-commercial use, attribution required, and "content and applications must not be modified." |
| Attribution to display | `Global Recordings Network, https://globalrecordings.net/. Licensed CC BY-NC-SA unless the program page says otherwise.` |
| Used in unit 1 | No. |

### Could not verify

- A GraphQL-specific contract beyond the apply page and the sitewide copyright and terms pages.
- The endpoint URL, which is not on the public page.
- How to reconcile "do not modify content" (terms page) with "you may adapt under CC BY-NC-SA" (copyright page). Until Zach confirms, this project links and plays GRN media and does not adapt it.

## unfoldingWord / Door43

| | |
| --- | --- |
| What | Open biblical resources (translation helps, Open Bible Stories, and other catalogued works) for unit 2. The first language-resource adapter, because it needs no key. |
| Access | `GET https://api.door43.org/v3/catalog.json`. Documented at https://api-info.readthedocs.io/en/latest/door43.html. The catalog is a JSON tree of languages, resources, projects, and formats. Resource records include a `rights` field. The docs say keys may be added but existing key names will not change. Linked files are mostly on `https://cdn.door43.org`. |
| Key | No. |
| License / terms | unfoldingWord's license page was verified at https://unfoldingword.org/about/license/. Content they create is CC BY-SA 4.0. Share and adapt, including commercially, with attribution and ShareAlike. The unfoldingWord name and logo are trademarks and are not part of that grant. The catalog's own `rights` value wins for each resource. Some entries are not unfoldingWord's. |
| Attribution to display | `Original work available at unfoldingWord.org.` Plus the license: https://creativecommons.org/licenses/by-sa/4.0/. For Door43 community works, the translationAcademy text suggests: original work by the Door43 World Missions Community, available at https://door43.org/, CC BY-SA 4.0. Prefer the notice shipped with the resource. |
| Used in unit 1 | No. |

### Could not verify

- `https://door43.org/en/legal/license` redirected and the body was not readable in the fetch used here.
- A live `GET` of `https://api.door43.org/v3/catalog.json` from this environment. The host name did not resolve on 22 November 2026. The URL and the CC BY-SA `rights` examples are from the published API docs, which did load. Re-check the live catalog when unit 2 starts.

## US Census state boundaries

Not a people-group source. Used only to test whether a published latitude and longitude falls inside a state.

US Census Bureau cartographic boundaries, simplified, via the us-atlas project (`states-10m.json`, version 3.0.1). The boundary data is in the public domain. See `data/SOURCE.txt`. The file in this repo is the 50 states and the District of Columbia. It is not a people-group extract.

## ISO 3166 country codes

`src/core/data/iso3166.json` is a name and code lookup so "US" and "Turkey" can be sent as alpha-3 codes the PeopleGroups.org API accepts. It is not an IMB dataset. Country names follow ISO 3166-1 English short names.

## Secrets

No source in this file is shipped with a real key. Placeholders are in `.env.example`. Asking IMB, Joshua Project, Bible Brain, or Global Recordings Network for access is a step for Zach, written in [PLAN.md](PLAN.md).
