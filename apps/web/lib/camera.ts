import type { Map as MapLibreMap, PaddingOptions } from "maplibre-gl";

declare global {
  interface Window {
    __ATLAS_MAP__?: MapLibreMap;
    __ATLAS_PADDING__?: CameraPadding;
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
  minVisibleRatio = 0.3,
): CameraPadding {
  const minVisibleX = Math.max(64, Math.round(width * minVisibleRatio));
  const minVisibleY = Math.max(80, Math.round(height * minVisibleRatio));
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

export function exposeAtlasPadding(padding: CameraPadding): void {
  if (!isTestMode()) return;
  window.__ATLAS_PADDING__ = padding;
}

export function mapHasSize(map: MapLibreMap): boolean {
  const node = map.getContainer();
  return node.clientWidth >= 40 && node.clientHeight >= 40;
}

/**
 * Fit the map to [west, south, east, north]. Returns false when the container
 * is not ready so the caller can retry on load.
 *
 * Uses absolutePadding so leftover easeTo padding is not added on top of this
 * fit. Camera padding is the only inset (about 10–15% on desktop).
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
  exposeAtlasPadding(padding);
  const [west, south, east, north] = bounds;
  const box: [[number, number], [number, number]] = [
    [west, south],
    [east, north],
  ];
  map.stop();
  const fitted = map.cameraForBounds(box, {
    padding: padding as PaddingOptions,
    absolutePadding: true,
    maxZoom: 8,
  });
  if (!fitted) {
    const fallback = clampCameraPadding(node.clientWidth, node.clientHeight, {
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
    });
    exposeAtlasPadding(fallback);
    const retry = map.cameraForBounds(box, {
      padding: fallback as PaddingOptions,
      absolutePadding: true,
      maxZoom: 8,
    });
    if (!retry) return false;
    map.fitBounds(box, {
      padding: fallback,
      absolutePadding: true,
      duration,
      linear: true,
      maxZoom: 8,
    });
    return true;
  }
  map.fitBounds(box, {
    padding,
    absolutePadding: true,
    duration,
    linear: true,
    maxZoom: 8,
  });
  return true;
}
