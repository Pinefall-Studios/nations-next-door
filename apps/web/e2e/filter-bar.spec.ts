import { expect, test } from "@playwright/test";

test.describe("filter chip row", () => {
  test("stays on one line at 1280 and 1440", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "mobile uses the horizontal scroller");
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const row = page.locator(".chip-row");
      await expect(row).toBeVisible();
      const rowBox = await row.boundingBox();
      expect(rowBox).not.toBeNull();
      if (!rowBox) return;
      expect(rowBox.height, `chip row wrapped at ${width}px`).toBeLessThan(56);
      const items = row.locator(":scope > *");
      const count = await items.count();
      expect(count).toBeGreaterThan(3);
      const first = await items.nth(0).boundingBox();
      const last = await items.nth(count - 1).boundingBox();
      expect(first).not.toBeNull();
      expect(last).not.toBeNull();
      if (!first || !last) return;
      expect(Math.abs(first.y - last.y), `chips wrapped at ${width}px`).toBeLessThan(8);
    }
  });
});
