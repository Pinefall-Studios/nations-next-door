export type ResourceLink = {
  label: string;
  href: string;
  notice?: string;
};

export type ViewGroup = {
  pgid: string;
  name: string;
  nativeName: string | null;
  country: string | null;
  countryCode: string | null;
  usStates: string[];
  population: number | null;
  languageName: string | null;
  languageCode: string | null;
  religion: string | null;
  unreached: boolean | null;
  evangelicalBand: string | null;
  summary: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinatesRounded: boolean;
  bible: string | null;
  jesusFilm: string | null;
  audio: string | null;
  links: ResourceLink[];
  dataDate: string | null;
};

export type Catalog = {
  mode: "sample" | "live";
  /** Shown in the UI when the figures are not a live query. */
  sampleLabel: string | null;
  attribution: string;
  groups: ViewGroup[];
};

export type MapShape = {
  id: string;
  name: string;
  d: string;
  count: number;
};
