import { expect, test } from "@playwright/test";

function fullyInViewport(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): boolean {
  return (
    box.x >= 0
    && box.y >= 0
    && box.x + box.width <= viewport.width + 0.5
    && box.y + box.height <= viewport.height + 0.5
  );
}

test.describe("filter chip row", () => {
  test("keeps Sort and More filters on-screen at 1280 and 1440", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "mobile uses the horizontal scroller");
    for (const size of [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const toolbar = page.locator(".filter-toolbar");
      await expect(toolbar).toBeVisible();
      const toolbarBox = await toolbar.boundingBox();
      expect(toolbarBox, `toolbar missing at ${size.width}px`).not.toBeNull();
      if (!toolbarBox) return;
      expect(toolbarBox.height, `filter toolbar wrapped at ${size.width}px`).toBeLessThan(56);
      expect(toolbarBox.x + toolbarBox.width, `toolbar overflowed at ${size.width}px`).toBeLessThanOrEqual(size.width + 0.5);

      const more = page.getByRole("button", { name: "More filters" });
      const sort = page.locator(".sort-compact");
      await expect(more).toBeVisible();
      await expect(sort).toBeVisible();
      const moreBox = await more.boundingBox();
      const sortBox = await sort.boundingBox();
      expect(moreBox).not.toBeNull();
      expect(sortBox).not.toBeNull();
      if (!moreBox || !sortBox) return;
      expect(fullyInViewport(moreBox, size), `More filters off-screen at ${size.width}px`).toBe(true);
      expect(fullyInViewport(sortBox, size), `Sort off-screen at ${size.width}px`).toBe(true);
    }
  });
});
