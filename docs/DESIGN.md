# Nations Next Door: Design direction v1 (from Mira, Nov 22, 2026)

## Mood
Warm, reverent, modern. A well-made missions atlas on a kitchen table, not a war room or SaaS dashboard. Quiet paper, one warm accent, people with dignity. Each screen answers one question and offers one next step (pray, or find resources). Mobile-first: a missions-team member in a hallway finds a group and opens its card in under 10 seconds.

## Type (Google Fonts)
- Display/headings: Fraunces (opsz on, 500-600, soft). People-group names and page titles only.
- UI/body: Inter 400/500/600, 16px mobile base, line-height 1.5.
- Native names/scripts: Noto Sans family (Noto Serif where fitting), loaded per script. Native name in its own script is a first-class line; never tofu.
- Numbers: Inter tabular figures.

## Palette
- Paper #FAF6EF; Card #FFFFFF; hairline #E7DFD2
- Ink #1F1B16; secondary #6B6158
- Ember (single accent: primary action, unreached emphasis) #B4532A, pressed #8F3F1F. Ember text on paper is AA; ink labels on ember tints.
- Olive (resources available) #5E6B3A
- Gold (scripture, tiny highlights) #B8913A
- Map: land #EDE4D3, water #DCE6EA, borders #CFC4B2
- Unreached scale (light to deep): #F6E3D6, #E9B99A, #D58A60, #B4532A, #7E3418
- No red alerts, no rainbow categories.

## Map
Calm desaturated basemap, no satellite or busy labels. Single-hue ember choropleth by state/country, plain-word legend ("fewer believers ->"). Cluster markers at low zoom, no pin storm. Tap region: bottom sheet (mobile) / side panel (desktop) listing groups largest first. Map is the doorway; list is the work. Always show data source.

## People-group card
Top: licensed photo with credit, else warm pattern tile with initial (never stock). Name (Fraunces), native name in own script, country, primary language. One plain status sentence with source; if IMB and Joshua Project disagree, show both quietly. "Resources in [language]" as olive chips linking out (Bible, audio, JESUS film, unfoldingWord). Actions: Pray (ember, primary), Print prayer card (secondary). Population in tabular figures. No other stats.

## Chat
Kind, careful librarian, not a chatbot: no sparkle icon, persona name, or "AI" badge. Three plain suggested questions to start ("Who is unreached in Texas?"). Short answers, inline source citations, matching people-group cards inline so the user can act. Says plainly when the data doesn't know. Input at bottom, thumb-friendly send. Same paper and type as the site.

## Prayer card (print)
4x6 in postcard, 0.125 in bleed, plus 2-up on US Letter. Must work in black and white.
- Front: photo/pattern tile (top 55%), name (Fraunces), native name, country and population, Revelation 7:9 small in gold/gray.
- Back: "Pray for the [name]", three short prayer points, primary language and available resources, QR to group page, footer with source, data date, small Nations Next Door mark.
- Margins >= 0.375 in, body >= 10pt, no web chrome.

## Avoid
1. Exoticizing or poverty imagery; people as decoration. Licensed photos with credit or pattern tile; names and dignity first.
2. War-room urgency: red alerts, ticking "lost" counters, guilt copy, metric-stacked dashboards.
3. AI-flavored chrome: sparkles, glowing gradients, chat taking over the site, unsourced answers.

Mira will craft-gate the first UI build before it merges.
