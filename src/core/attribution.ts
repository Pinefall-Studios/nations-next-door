export interface SourceCitation {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

/** The credit line with the month and year still to be filled in. */
export const IMB_ATTRIBUTION_TEMPLATE =
  "This information was provided by The International Mission Board - Global Research, [Month Year], Nations Next Door, www.peoplegroups.org";

export function imbAttribution(when: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(when);
  const year = when.getUTCFullYear();
  return `This information was provided by The International Mission Board - Global Research, ${month} ${year}, Nations Next Door, www.peoplegroups.org`;
}

/** One-line credit for the explore banner. Links to the full sentence in the footer. */
export function imbShortCredit(when: Date): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(when);
  return `Source: IMB Global Research · ${month} ${when.getUTCFullYear()}`;
}

export function imbShortCreditFrom(attribution: string): string {
  const match = attribution.match(/Global Research,\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match?.[1] || !match[2]) return "Source: IMB Global Research · Nov 2026";
  return `Source: IMB Global Research · ${match[1].slice(0, 3)} ${match[2]}`;
}

export function imbSource(when: Date): SourceCitation {
  return {
    id: "imb-peoplegroups",
    name: "IMB Global Research",
    url: "https://peoplegroups.org/",
    attribution: imbAttribution(when),
  };
}

export const US_STATE_GEOGRAPHY_NOTE =
  "US state is assigned from the published latitude and longitude, tested against US Census Bureau state boundaries (cartographic boundary files, simplified by the us-atlas project, public domain; the 50 states and the District of Columbia). State names in the published location text are included too, and that text is discarded. It is not cached or returned. A group can match more than one state. A point near a border can fall in the neighboring state. This is not a roster of residents, churches, or workers. In Open Doors World Watch List 2026 countries, coordinates are rounded to one decimal degree before they are returned.";
