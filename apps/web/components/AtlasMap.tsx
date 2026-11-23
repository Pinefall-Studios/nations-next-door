"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import Map, { Layer, NavigationControl, Source, type MapMouseEvent, type MapRef } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE } from "../lib/basemap";
import { bandIndex, pointRadius } from "../lib/band-color";
import {
  clampCameraPadding,
  exposeAtlasMap,
  fitMapToBounds,
  isTestMode,
  mapHasSize,
  sheetOverlapBottom,
  waitForLayoutSettle,
  type CameraPadding,
} from "../lib/camera";
import { ensureMapWorker } from "../lib/maplibre-worker";
import type { DockPoint } from "../lib/group-dock";
import type { MapCommand } from "../lib/map-command";
import type { ViewGroup } from "../lib/view";

ensureMapWorker();

type HoverInfo = { group: ViewGroup; x: number; y: number };

const US_VIEW = { longitude: -96.8, latitude: 37.8, zoom: 3.5 };
const WORLD_VIEW = { longitude: 8, latitude: 18, zoom: 1.6 };

function nativeMap(ref: MapRef | null): MapLibreMap | null {
  return ref?.getMap() ?? null;
}

function chromeTopPadding(map: MapLibreMap, reserveUndo: boolean): number {
  const wrap = map.getContainer().closest(".atlas-wrap") ?? map.getContainer().closest(".atlas");
  const mapRect = map.getContainer().getBoundingClientRect();
  let bottom = 0;
  const chrome = wrap?.querySelector(".atlas-chrome") ?? wrap?.querySelector(".atlas-toggle");
  if (chrome instanceof HTMLElement) {
    bottom = Math.max(bottom, chrome.getBoundingClientRect().bottom - mapRect.top);
  }
  const chip = wrap?.querySelector(".undo-chip");
  if (chip instanceof HTMLElement) {
    bottom = Math.max(bottom, chip.getBoundingClientRect().bottom - mapRect.top);
  } else if (reserveUndo) {
    bottom += 48;
  }
  return Math.max(72, Math.ceil(bottom) + 16);
}

function cameraPadding(map: MapLibreMap, kind: "fit" | "point" | "scope"): CameraPadding {
  const mobile = window.matchMedia("(max-width: 959px)").matches;
  const canvas = map.getContainer();
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  if (mobile) {
    const top = chromeTopPadding(map, kind === "fit");
    const bottom = Math.min(sheetOverlapBottom(map, 12), Math.max(0, height - top - 80));
    return clampCameraPadding(width, height, { top, bottom, left: 16, right: 16 }, 0.15);
  }
  if (kind === "fit") {
    const padX = Math.round(width * 0.12);
    const padY = Math.round(height * 0.12);
    return clampCameraPadding(width, height, { top: padY, bottom: padY, left: padX, right: padX }, 0.55);
  }
  return clampCameraPadding(width, height, { top: 72, bottom: 72, left: 48, right: 80 });
}

export function AtlasMap({
  groups,
  scope,
  selectedPgid,
  highlightedPgids,
  command,
  bloom,
  sheetMode,
  onSelect,
  onHover,
  onSelectedPoint,
  onScope,
}: {
  groups: ViewGroup[];
  scope: "us" | "world";
  selectedPgid: string | null;
  highlightedPgids: string[];
  command: MapCommand | null;
  bloom: boolean;
  sheetMode: string;
  onSelect: (pgid: string | null) => void;
  onHover: (info: HoverInfo | null) => void;
  onSelectedPoint?: (point: DockPoint | null) => void;
  onScope: (scope: "us" | "world") => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const commandRef = useRef(command);
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
          radius: pointRadius(group.population),
        },
      }];
    }),
  }), [groups]);

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
    commandRef.current = command;
  }, [command]);

  useEffect(() => {
    let cancelled = false;
    let sizeTimer = 0;
    let sizeStop = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce || isTestMode() ? 0 : 500;

    function apply(map: MapLibreMap): boolean {
      exposeAtlasMap(map);
      map.resize();
      if (!mapHasSize(map)) return false;
      const padding = cameraPadding(map, command?.bounds ? "fit" : "scope");
      if (command?.bounds) {
        return fitMapToBounds(map, command.bounds, padding, duration);
      }
      const view = scope === "us" ? US_VIEW : WORLD_VIEW;
      map.stop();
      map.easeTo({ ...view, duration, padding });
      return true;
    }

    function attempt(): boolean {
      if (cancelled) return true;
      const map = nativeMap(mapRef.current);
      if (!map) return false;
      return apply(map);
    }

    function start() {
      if (attempt()) return;
      sizeTimer = window.setInterval(() => {
        if (attempt()) window.clearInterval(sizeTimer);
      }, 80);
      sizeStop = window.setTimeout(() => window.clearInterval(sizeTimer), 4000);
    }

    const mapNode = nativeMap(mapRef.current)?.getContainer();
    const sheet = mapNode?.closest(".explore")?.querySelector(".sheet")
      ?? document.querySelector(".explore .sheet")
      ?? null;
    const stopSettle = waitForLayoutSettle(sheet, start);
    return () => {
      cancelled = true;
      stopSettle();
      window.clearInterval(sizeTimer);
      window.clearTimeout(sizeStop);
    };
  }, [command, scope, sheetMode]);

  useEffect(() => {
    if (command?.bounds) return;
    const map = nativeMap(mapRef.current);
    const group = groups.find((item) => item.pgid === selectedPgid);
    if (!map || !group || group.latitude === null || group.longitude === null) return;
    if (command?.pgids.includes(group.pgid)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.stop();
    map.easeTo({
      center: [group.longitude, group.latitude],
      duration: reduce || isTestMode() ? 0 : 400,
      padding: cameraPadding(map, "point"),
    });
  }, [selectedPgid, groups, command, sheetMode]);

  useEffect(() => {
    if (!onSelectedPoint) return;
    let cancelled = false;
    let retry = 0;
    let detach: (() => void) | undefined;

    function report(map: MapLibreMap) {
      const group = groups.find((item) => item.pgid === selectedPgid);
      const canvas = map.getContainer();
      if (!group || group.latitude === null || group.longitude === null) {
        onSelectedPoint?.(null);
        return;
      }
      const pt = map.project([group.longitude, group.latitude]);
      onSelectedPoint?.({
        x: Math.round(pt.x),
        y: Math.round(pt.y),
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      });
    }

    function attach() {
      if (cancelled) return;
      const map = nativeMap(mapRef.current);
      if (!map) {
        retry = window.setTimeout(attach, 80);
        return;
      }
      const onMove = () => report(map);
      report(map);
      map.on("move", onMove);
      map.on("resize", onMove);
      detach = () => {
        map.off("move", onMove);
        map.off("resize", onMove);
      };
    }

    attach();
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      detach?.();
    };
  }, [selectedPgid, groups, onSelectedPoint]);

  function pick(event: MapMouseEvent): string | null {
    const features = event.features ?? [];
    const cluster = features.find((feature) => feature.layer.id === "clusters" || feature.layer.id === "cluster-count");
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
      <div className="atlas-chrome">
        <div className="atlas-toggle segment" role="group" aria-label="Map">
          <button type="button" aria-pressed={scope === "us"} onClick={() => onScope("us")}>United States</button>
          <button type="button" aria-pressed={scope === "world"} onClick={() => onScope("world")}>World</button>
        </div>
        {scope === "world" ? (
          <p className="world-note">This view currently covers groups in the United States.</p>
        ) : null}
      </div>
      <div
        data-testid="map-bloom"
        data-active={bloom ? "true" : "false"}
        className={bloom ? "map-bloom is-on" : "map-bloom"}
        aria-hidden="true"
      />
      <Map
        ref={mapRef}
        mapStyle={BASEMAP_STYLE}
        initialViewState={scope === "us" ? US_VIEW : WORLD_VIEW}
        attributionControl={{ compact: true }}
        interactiveLayerIds={["points", "clusters", "cluster-count"]}
        cursor="pointer"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        onLoad={() => {
          const map = nativeMap(mapRef.current);
          if (!map) return;
          exposeAtlasMap(map);
          map.resize();
          if (!commandRef.current?.bounds) return;
          const sheet = map.getContainer().closest(".explore")?.querySelector(".sheet") ?? null;
          const bounds = commandRef.current.bounds;
          waitForLayoutSettle(sheet, () => {
            if (!bounds) return;
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            fitMapToBounds(
              map,
              bounds,
              cameraPadding(map, "fit"),
              reduce || isTestMode() ? 0 : 500,
            );
          });
        }}
        onClick={(event) => onSelect(pick(event))}
        onMouseMove={(event) => {
          const pointer = "originalEvent" in event && event.originalEvent instanceof PointerEvent
            ? event.originalEvent.pointerType
            : "";
          if (pointer === "touch" || window.matchMedia("(pointer: coarse)").matches) return;
          const pgid = pick(event);
          const group = groups.find((item) => item.pgid === pgid) ?? null;
          onHover(group ? { group, x: event.point.x, y: event.point.y } : null);
        }}
        onMouseLeave={() => onHover(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />
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
            id="state-line"
            type="line"
            layout={{ visibility: scope === "us" ? "visible" : "none" }}
            paint={{ "line-color": "#CFC4B2", "line-width": 0.6, "line-opacity": 0.65 }}
          />
          <Layer
            id="state-focus-fill"
            type="fill"
            filter={command?.stateCode ? ["==", ["get", "postal"], command.stateCode] : ["==", ["get", "postal"], ""]}
            layout={{ visibility: command?.stateCode ? "visible" : "none" }}
            paint={{ "fill-color": "#B4532A", "fill-opacity": 0.06 }}
          />
          <Layer
            id="state-focus-line"
            type="line"
            filter={command?.stateCode ? ["==", ["get", "postal"], command.stateCode] : ["==", ["get", "postal"], ""]}
            layout={{ visibility: command?.stateCode ? "visible" : "none" }}
            paint={{ "line-color": "#B4532A", "line-width": 2, "line-opacity": 0.95 }}
          />
        </Source>
        <Source
          id="groups"
          type="geojson"
          data={collection}
          cluster
          clusterMaxZoom={5}
          clusterRadius={42}
          clusterMinPoints={2}
          clusterProperties={{ deepest: ["max", ["get", "bandIndex"]] }}
          promoteId="pgid"
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": ["interpolate", ["linear"], ["get", "deepest"], 0, "#F6E3D6", 1, "#E9B99A", 2, "#D58A60", 3, "#B4532A", 4, "#7E3418"],
              "circle-radius": ["interpolate", ["linear"], ["get", "point_count"], 2, 16, 12, 22, 36, 28],
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
              "text-font": ["Noto Sans Bold", "Noto Sans Regular"],
              "text-size": 13,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": ["case", [">=", ["get", "deepest"], 3], "#FAF6EF", "#1F1B16"],
              "text-halo-color": ["case", [">=", ["get", "deepest"], 3], "#7E3418", "#FAF6EF"],
              "text-halo-width": 1.1,
            }}
          />
          <Layer
            id="points-halo"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#B4532A",
              "circle-radius": ["+", ["get", "radius"], 8],
              "circle-opacity": [
                "case",
                ["boolean", ["feature-state", "bloom"], false], 0.35,
                ["boolean", ["feature-state", "highlight"], false], 0.16,
                0,
              ],
            }}
          />
          <Layer
            id="points"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["interpolate", ["linear"], ["get", "bandIndex"], 0, "#F6E3D6", 1, "#E9B99A", 2, "#D58A60", 3, "#B4532A", 4, "#7E3418"],
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
