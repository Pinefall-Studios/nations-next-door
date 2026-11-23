import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";

declare global {
  interface Window {
    __ATLAS_MAP__?: MapLibreMap;
  }
}

export type CameraPadding = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Keep enough of the map visible that MapLibre will not no-op fitBounds. */
export function clampCameraPadding(
  width: number,
  height: number,
  wanted: CameraPadding,
): CameraPadding {
  const minVisibleX = Math.max(96, Math.round(width * 0.3));
  const minVisibleY = Math.max(96, Math.round(height * 0.3));
  const maxX = Math.max(0, width - minVisibleX);
  const maxY = Math.max(0, height - minVisibleY);
  let left = Math.max(0, wanted.left);
  let right = Math.max(0, wanted.right);
  let top = Math.max(0, wanted.top);
  let bottom = Math.max(0, wanted.bottom);
  if (left + right > maxX) {
    const scale = maxX / (left + right || 1);
    left = Math.floor(left * scale);
    right = Math.floor(right * scale);
  }
  if (top + bottom > maxY) {
    const scale = maxY / (top + bottom || 1);
    top = Math.floor(top * scale);
    bottom = Math.floor(bottom * scale);
  }
  return { top, right, bottom, left };
}

export function isTestMode(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.navigator.webdriver || new URLSearchParams(window.location.search).has("e2e"),
  );
}

export function exposeAtlasMap(map: MapLibreMap): void {
  if (!isTestMode()) return;
  window.__ATLAS_MAP__ = map;
}

export function mapHasSize(map: MapLibreMap): boolean {
  const node = map.getContainer();
  return node.clientWidth >= 40 && node.clientHeight >= 40;
}

/**
 * Fit the map to [west, south, east, north]. Returns false when the container
 * is not ready so the caller can retry on load.
 */
export function fitMapToBounds(
  map: MapLibreMap,
  bounds: [number, number, number, number],
  wanted: CameraPadding,
  duration: number,
): boolean {
  map.resize();
  if (!mapHasSize(map)) return false;
  const node = map.getContainer();
  const padding = clampCameraPadding(node.clientWidth, node.clientHeight, wanted);
  const [west, south, east, north] = bounds;
  const box: [[number, number], [number, number]] = [
    [west, south],
    [east, north],
  ];
  map.stop();
  const fitted = map.cameraForBounds(box, { padding: padding as PaddingOptions });
  if (!fitted) {
    const fallback = clampCameraPadding(node.clientWidth, node.clientHeight, {
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
    });
    const retry = map.cameraForBounds(box, { padding: fallback as PaddingOptions });
    if (!retry) return false;
    map.fitBounds(box, { padding: fallback, duration, linear: true });
    return true;
  }
  map.fitBounds(box, { padding, duration, linear: true });
  return true;
}
