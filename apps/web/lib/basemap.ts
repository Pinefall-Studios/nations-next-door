import type { StyleSpecification } from "maplibre-gl";

/** OpenFreeMap vector tiles, restyled to Mira's paper atlas. No key. */
export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  name: "Nations Next Door",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
      attribution:
        '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://openfreemap.org">OpenFreeMap</a>',
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#DCE6EA" } },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#DCE6EA" },
    },
    {
      id: "boundary-state",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", ["get", "admin_level"], 4],
      minzoom: 5,
      paint: {
        "line-color": "#CFC4B2",
        "line-width": 0.6,
        "line-opacity": 0.7,
      },
    },
    {
      id: "boundary-country",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      filter: ["==", ["get", "admin_level"], 2],
      paint: {
        "line-color": "#CFC4B2",
        "line-width": 0.75,
      },
    },
    {
      id: "label-country",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 4,
      filter: ["all", ["==", ["get", "class"], "country"], ["<=", ["get", "rank"], 4]],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-padding": 8,
      },
      paint: {
        "text-color": "#6B6158",
        "text-halo-color": "#FAF6EF",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "label-state",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 5,
      filter: ["in", ["get", "class"], ["literal", ["state", "province"]]],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: {
        "text-color": "#6B6158",
        "text-halo-color": "#FAF6EF",
        "text-halo-width": 1.1,
      },
    },
    {
      id: "label-city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 8,
      filter: ["all", ["==", ["get", "class"], "city"], ["<=", ["get", "rank"], 6]],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: {
        "text-color": "#6B6158",
        "text-halo-color": "#FAF6EF",
        "text-halo-width": 1,
      },
    },
  ],
};
