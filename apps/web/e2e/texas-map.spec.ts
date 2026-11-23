import { expect, test, type Page } from "@playwright/test";

const TEXAS = { west: -106.65, south: 25.84, east: -93.51, north: 36.5 };

async function askTexas(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Ask" }).first().click();
  await page.getByRole("button", { name: "Who is unreached in Texas?" }).click();
  await expect(page.getByRole("button", { name: /Showing Texas/ })).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__ATLAS_MAP__), { timeout: 20_000 });
  await page.evaluate(() => {
    const map = window.__ATLAS_MAP__;
    return new Promise<void>((resolve) => {
      if (!map) {
        resolve();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      map.once("moveend", finish);
      if (!map.isMoving() && !map.isZooming()) window.setTimeout(finish, 400);
    });
  });
}

async function texasFillRatio(page: Page) {
  return page.evaluate((texas) => {
    const map = window.__ATLAS_MAP__;
    if (!map) return 0;
    const stored = window.__ATLAS_PADDING__;
    const live = map.getPadding();
    const pad = {
      top: stored?.top ?? live.top ?? 0,
      bottom: stored?.bottom ?? live.bottom ?? 0,
      left: stored?.left ?? live.left ?? 0,
      right: stored?.right ?? live.right ?? 0,
    };
    const canvas = map.getContainer();
    const visW = Math.max(1, canvas.clientWidth - pad.left - pad.right);
    const visH = Math.max(1, canvas.clientHeight - pad.top - pad.bottom);
    const sw = map.project([texas.west, texas.south]);
    const ne = map.project([texas.east, texas.north]);
    const txW = Math.abs(ne.x - sw.x);
    const txH = Math.abs(sw.y - ne.y);
    return Math.max(txW / visW, txH / visH);
  }, TEXAS);
}

test.describe("Texas chat frames the state", () => {
  test("fits Texas tightly, outlines the state, and clears on Back", async ({ page }) => {
    await askTexas(page);

    await page.waitForFunction((texas) => {
      const map = window.__ATLAS_MAP__;
      if (!map) return false;
      const stored = window.__ATLAS_PADDING__;
      const live = map.getPadding();
      const pad = {
        top: stored?.top ?? live.top ?? 0,
        bottom: stored?.bottom ?? live.bottom ?? 0,
        left: stored?.left ?? live.left ?? 0,
        right: stored?.right ?? live.right ?? 0,
      };
      const canvas = map.getContainer();
      const visW = Math.max(1, canvas.clientWidth - pad.left - pad.right);
      const visH = Math.max(1, canvas.clientHeight - pad.top - pad.bottom);
      const sw = map.project([texas.west, texas.south]);
      const ne = map.project([texas.east, texas.north]);
      const txW = Math.abs(ne.x - sw.x);
      const txH = Math.abs(sw.y - ne.y);
      return Math.max(txW / visW, txH / visH) >= 0.55;
    }, TEXAS, { timeout: 15_000 });

    const bounds = await page.evaluate(() => {
      const box = window.__ATLAS_MAP__?.getBounds();
      if (!box) return null;
      return {
        west: box.getWest(),
        south: box.getSouth(),
        east: box.getEast(),
        north: box.getNorth(),
      };
    });
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    expect(bounds.west).toBeLessThanOrEqual(TEXAS.west);
    expect(bounds.south).toBeLessThanOrEqual(TEXAS.south);
    expect(bounds.east).toBeGreaterThanOrEqual(TEXAS.east);
    expect(bounds.north).toBeGreaterThanOrEqual(TEXAS.north);

    const fill = await texasFillRatio(page);
    expect(fill).toBeGreaterThanOrEqual(0.55);

    const outline = await page.evaluate(() => {
      const map = window.__ATLAS_MAP__;
      if (!map?.getLayer("state-focus-line")) return null;
      return {
        filter: JSON.stringify(map.getFilter("state-focus-line")),
        visibility: String(map.getLayoutProperty("state-focus-line", "visibility") ?? ""),
      };
    });
    expect(outline).not.toBeNull();
    expect(outline?.filter).toContain("TX");
    expect(outline?.visibility).not.toBe("none");

    await page.getByRole("button", { name: /Back to previous view/ }).click();
    await expect(page.getByRole("button", { name: /Showing Texas/ })).toHaveCount(0);
    await page.waitForFunction(() => {
      const map = window.__ATLAS_MAP__;
      if (!map?.getLayer("state-focus-line")) return true;
      const visibility = map.getLayoutProperty("state-focus-line", "visibility");
      return visibility === "none";
    });
  });
});
