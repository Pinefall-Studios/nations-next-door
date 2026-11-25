export type DockPoint = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DockPlacement = {
  top: number | "auto";
  bottom: number | "auto";
  left: number | "auto";
  right: number | "auto";
  maxHeight: number | string;
  flip: "above" | "below";
};

export const DOCK_WIDTH = 360;
const GAP = 8;
const PAD = 12;
const MIN_HEIGHT = 180;

/** Place the desktop group card 8px off the selected point, flipping above when the map runs out below. */
export function placeGroupDock(point: DockPoint | null): DockPlacement {
  if (!point || point.width < 80 || point.height < 80) {
    return {
      top: PAD,
      bottom: "auto",
      left: "auto",
      right: PAD,
      maxHeight: `calc(100% - ${PAD * 2}px)`,
      flip: "below",
    };
  }

  const mapCap = Math.max(0, point.height - PAD * 2);
  const spaceBelow = point.height - point.y - GAP - PAD;
  const spaceAbove = point.y - GAP - PAD;
  const flip: "above" | "below" = spaceBelow >= MIN_HEIGHT || spaceBelow >= spaceAbove
    ? "below"
    : "above";
  const available = flip === "below" ? spaceBelow : spaceAbove;
  const maxHeight = Math.min(mapCap, Math.max(available, 0));
  if (maxHeight < 80) {
    return {
      top: PAD,
      bottom: "auto",
      left: Math.max(PAD, point.width - DOCK_WIDTH - PAD),
      right: "auto",
      maxHeight: mapCap,
      flip: "below",
    };
  }

  let left = point.x - DOCK_WIDTH / 2;
  left = Math.max(PAD, Math.min(left, point.width - DOCK_WIDTH - PAD));

  if (flip === "below") {
    const top = Math.max(PAD, point.y + GAP);
    return { top, bottom: "auto", left, right: "auto", maxHeight, flip };
  }

  const bottom = Math.max(PAD, point.height - (point.y - GAP));
  return { top: "auto", bottom, left, right: "auto", maxHeight, flip };
}
