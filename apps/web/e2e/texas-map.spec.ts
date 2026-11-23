import { expect, test } from "@playwright/test";

const TEXAS = { west: -106.65, south: 25.84, east: -93.51, north: 36.5 };

test.describe("Texas chat frames the state", () => {
  test("asks the Texas question, waits for moveend, and contains Texas", async ({ page }) => {
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
    await page.waitForFunction(() => {
      const box = window.__ATLAS_MAP__?.getBounds();
      if (!box) return false;
      return (
        box.getWest() <= -106.65
        && box.getSouth() <= 25.84
        && box.getEast() >= -93.51
        && box.getNorth() >= 36.5
      );
    }, { timeout: 15_000 });

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
  });
});
