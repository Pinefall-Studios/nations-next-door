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

## Interactive map and librarian

Direction from Mira for the interactive map and librarian. Where this differs from the Map and Chat sections above, follow this section.

BASEMAP: land #EDE4D3, water #DCE6EA, borders #CFC4B2 0.75px (state borders lighter than country). No terrain, roads, satellite, or POIs. Labels Inter 11px #6B6158: countries at low zoom, states and major cities only when zoomed in. Faint paper grain or none, no drop shadows. US/World toggle as a small segmented control at the map's top-left.

POINTS/CLUSTERS: points filled from the unreached scale #F6E3D6 to #7E3418 by evangelical band (deep = fewer believers), 1.5px #FAF6EF ring, sized by population on a gentle sqrt scale 6-18px. Clusters are soft circles in the deepest ember they contain, count in Inter 600 with AA contrast, one ring, no pulsing. When points are on, the state choropleth drops to a quiet tint, and off at city zoom. Selected point: 2px ink ring plus small lift. Don't dim the rest. No pins, no red.

TOOLTIP (desktop): white paper card, 1px #E7DFD2 hairline, 8px radius, soft shadow, 8px off the point and never covering it. Content: name in Fraunces 16, native name in its script, 'Population · Language', and a 5-step band mini-bar. 120ms delay, 150ms fade. Click opens the card. Touch: no tooltip, tap opens the sheet.

FILTERS: one chip row above the map (Unreached only, default on; Language; Religion; Scripture available; Place). Active chip: ink text on #F6E3D6. Inactive: hairline outline. Ember fill is for the primary action only. Live result line ('47 groups in Texas') plus a quiet Clear. Map and list update together. Mobile: chips scroll horizontally, 'More filters' opens a sheet.

MOBILE SHEET: map fills the screen. Sheet detents: peek ~96px (count plus top group), half (list), full (group card). Grab handle, 16px top radius, paper background, hairline top. Drag and tap both work. Tapping a point raises the sheet to half and scrolls to that group, and the map recenters so the point stays visible above the sheet. Pray (ember) and Ask (secondary) pinned at the bottom of the full sheet. Ask also goes in the sheet header and on the card.

LIBRARIAN: desktop right panel 380-420px, map stays live and fully visible, no scrim. Mobile: chat takes the full sheet, and the map stays visible above at half height whenever an answer moves it. Answer = one short sentence plus tappable group cards, with a small source line on its own line at the bottom. When an answer names places or groups, the map eases 400-600ms ease-out to fit them, with a single soft ring bloom that fades, then a quiet highlight until the next question. No bouncing, flashing, or loops. Card and point hover/tap highlight each other. Every map move gets an undo chip ('Showing Texas · Back to previous view'). Loading is a 'Looking…' line, no typing-dots marathon. No sparkles or AI badges. 'Demo mode' in small text. prefers-reduced-motion: cut, no zoom animation.

A11Y: every map group is also in the list. Points are keyboard-focusable with the selected ring. Tooltip content is also the aria-label. There is no floating Ask button.
