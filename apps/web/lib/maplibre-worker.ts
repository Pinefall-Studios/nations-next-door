import { setWorkerUrl } from "maplibre-gl";

/** Serve MapLibre's worker from /public so Next does not break the bundled worker URL. */
export function ensureMapWorker(): void {
  if (typeof window === "undefined") return;
  setWorkerUrl("/maplibre-gl-worker.mjs");
}
