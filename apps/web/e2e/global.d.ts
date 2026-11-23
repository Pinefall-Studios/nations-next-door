import type { Map as MapLibreMap } from "maplibre-gl";

export {};

declare global {
  interface Window {
    __ATLAS_MAP__?: MapLibreMap;
  }
}
