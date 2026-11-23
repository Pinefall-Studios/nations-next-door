"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import Map, { Layer, NavigationControl, Source, type MapMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE } from "../lib/basemap";
import { bandColor, bandIndex, pointRadius } from "../lib/band-color";
import { ensureMapWorker } from "../lib/maplibre-worker";
import type { MapCommand } from "../lib/map-command";
import type { ViewGroup } from "../lib/view";

ensureMapWorker();

type HoverInfo = { group: ViewGroup; x: number; y: number };

const US_VIEW = { longitude: -96.8, latitude: 37.8, zoom: 3.5 };
const WORLD_VIEW = { longitude: 8, latitude: 18, zoom: 1.6 };

export function AtlasMap({
  groups,
  scope,
  selectedPgid,
  highlightedPgids,
  command,
  bloom,
  onSelect,
  onHover,
  onScope,
}: {
  groups: ViewGroup[];
  scope: "us" | "world";
  selectedPgid: string | null;
  highlightedPgids: string[];
  command: MapCommand | null;
  bloom: boolean;
  onSelect: (pgid: string | null) => void;
  onHover: (info: HoverInfo | null) => void;
  onScope: (scope: "us" | "world") => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const collection = useMemo<FeatureCollection<Point>>(() => ({
    type: "FeatureCollection",
    features: groups.flatMap((group) => {
      if (group.latitude === null || group.longitude === null) return [];
      return [{
        type: "Feature" as const,
        id: group.pgid,
        geometry: { type: "Point" as const, coordinates: [group.longitude, group.latitude] },
        properties: {
          pgid: group.pgid,
          name: group.name,
          population: group.population ?? 0,
          language: group.languageName ?? "",
          band: group.evangelicalBand ?? "",
          bandIndex: bandIndex(group.evangelicalBand),
          color: bandColor(group.evangelicalBand),
          radius: pointRadius(group.population),
        },
      }];
    }),
  }), [groups]);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const group of groups) {
      if (group.unreached !== true) continue;
      for (const state of group.usStates) next[state] = (next[state] ?? 0) + 1;
    }
    return next;
  }, [groups]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !map.getSource("groups")) return;
    for (const group of groups) {
      try {
        map.setFeatureState(
          { source: "groups", id: group.pgid },
          {
            selected: group.pgid === selectedPgid,
            highlight: highlightedPgids.includes(group.pgid),
            bloom: bloom && highlightedPgids.includes(group.pgid),
          },
        );
      } catch {
        // Source may not be ready on the first pass.
      }
    }
  }, [groups, selectedPgid, highlightedPgids, bloom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 500;
    if (command?.bounds) {
      const [west, south, east, north] = command.bounds;
      map.fitBounds(
        [[west, south], [east, north]],
        { padding: 72, duration, easing: (t) => 1 - (1 - t) ** 3 },
      );
      return;
    }
    const view = scope === "us" ? US_VIEW : WORLD_VIEW;
    map.easeTo({ ...view, duration });
  }, [command, scope]);

  function pick(event: MapMouseEvent): string | null {
    const features = event.features ?? [];
    const cluster = features.find((feature) => feature.layer.id === "clusters");
    if (cluster && mapRef.current) {
      const source = mapRef.current.getSource("groups");
      if (source && "getClusterExpansionZoom" in source) {
        const clusterId = cluster.properties?.cluster_id as number;
        const coords = (cluster.geometry as Point).coordinates as [number, number];
        Promise.resolve(
          (source as { getClusterExpansionZoom: (id: number) => Promise<number> | number }).getClusterExpansionZoom(clusterId),
        ).then((zoom) => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          mapRef.current?.easeTo({ center: coords, zoom, duration: reduce ? 0 : 450 });
        }).catch(() => undefined);
      }
      return null;
    }
    const point = features.find((feature) => feature.layer.id === "points");
    return typeof point?.properties?.pgid === "string" ? point.properties.pgid : null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (groups.length === 0) return;
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key) && event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    if (event.key === "Escape") {
      onSelect(null);
      return;
    }
    const index = groups.findIndex((group) => group.pgid === selectedPgid);
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = groups[(index + delta + groups.length) % groups.length];
    if (next) onSelect(next.pgid);
  }

  const selected = groups.find((group) => group.pgid === selectedPgid) ?? groups[0] ?? null;
  const mapLabel = selected
    ? `${selected.name}. ${selected.population?.toLocaleString("en-US") ?? "Population not listed"} · ${selected.languageName ?? "language not listed"}. Evangelical band ${selected.evangelicalBand ?? "not stated"}.`
    : `${groups.length} people groups. The list beside the map has the same groups.`;

  return (
    <div
      className="atlas"
      tabIndex={0}
      role="application"
      aria-label={mapLabel}
      onKeyDown={onKeyDown}
    >
      <div className="atlas-toggle segment" role="group" aria-label="Map">
        <button type="button" aria-pressed={scope === "us"} onClick={() => onScope("us")}>United States</button>
        <button type="button" aria-pressed={scope === "world"} onClick={() => onScope("world")}>World</button>
      </div>
      <Map
        ref={mapRef}
        mapStyle={BASEMAP_STYLE}
        initialViewState={scope === "us" ? US_VIEW : WORLD_VIEW}
        attributionControl={{ compact: true }}
        interactiveLayerIds={["points", "clusters"]}
        cursor="pointer"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        onClick={(event) => onSelect(pick(event))}
        onMouseMove={(event) => {
          if (window.matchMedia("(pointer: coarse)").matches) return;
          const pgid = pick(event);
          const group = groups.find((item) => item.pgid === pgid) ?? null;
          onHover(group ? { group, x: event.point.x, y: event.point.y } : null);
        }}
        onMouseLeave={() => onHover(null)}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <Source id="world" type="geojson" data="/api/geo/world">
          <Layer
            id="world-fill"
            type="fill"
            paint={{ "fill-color": "#EDE4D3", "fill-opacity": 1 }}
          />
          <Layer
            id="world-line"
            type="line"
            paint={{ "line-color": "#CFC4B2", "line-width": 0.75 }}
          />
        </Source>
        <Source id="states" type="geojson" data="/api/geo/states">
          <Layer
            id="state-fill"
            type="fill"
            maxzoom={8}
            layout={{ visibility: scope === "us" ? "visible" : "none" }}
            paint={{
              "fill-color": (Object.keys(counts).length
                ? ["match", ["get", "postal"], ...Object.entries(counts).flatMap(([code, count]) => [code, count >= 4 ? "#E9B99A" : "#F6E3D6"]), "#EDE4D3"]
                : "#EDE4D3") as never,
              "fill-opacity": 0.38,
            }}
          />
          <Layer
            id="state-line"
            type="line"
            layout={{ visibility: scope === "us" ? "visible" : "none" }}
            paint={{ "line-color": "#CFC4B2", "line-width": 0.6, "line-opacity": 0.7 }}
          />
        </Source>
        <Source
          id="groups"
          type="geojson"
          data={collection}
          cluster
          clusterMaxZoom={7}
          clusterRadius={46}
          clusterProperties={{ deepest: ["max", ["get", "bandIndex"]] }}
          promoteId="pgid"
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": ["interpolate", ["linear"], ["get", "deepest"], 0, "#F6E3D6", 2, "#D58A60", 4, "#7E3418"],
              "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 16, 24, 28],
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#FAF6EF",
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Noto Sans Regular"],
              "text-size": 12,
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": ["case", [">=", ["get", "deepest"], 3], "#FAF6EF", "#1F1B16"],
            }}
          />
          <Layer
            id="points-halo"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#B4532A",
              "circle-radius": ["+", ["get", "radius"], 7],
              "circle-opacity": [
                "case",
                ["boolean", ["feature-state", "bloom"], false], 0.28,
                ["boolean", ["feature-state", "highlight"], false], 0.14,
                0,
              ],
            }}
          />
          <Layer
            id="points"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                ["+", ["get", "radius"], 1],
                ["get", "radius"],
              ],
              "circle-stroke-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false], 2,
                ["boolean", ["feature-state", "highlight"], false], 2,
                1.5,
              ],
              "circle-stroke-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false], "#1F1B16",
                ["boolean", ["feature-state", "highlight"], false], "#B4532A",
                "#FAF6EF",
              ],
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
