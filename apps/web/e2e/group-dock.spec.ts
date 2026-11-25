import { expect, test, type Page } from "@playwright/test";

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

async function waitForCatalog(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".sheet-row").first()).toBeVisible({ timeout: 30_000 });
}

async function nameForBottomGroup(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const res = await fetch("/api/groups?country=USA&unreached=no");
    const body = await res.json() as {
      groups?: { name: string; latitude: number | null; longitude: number | null }[];
    };
    const groups = body.groups ?? [];
    const named = groups.find((group) => /Atsugewi/i.test(group.name));
    if (named) return named.name;
    const withPoint = groups.filter((group) => group.latitude != null);
    withPoint.sort((a, b) => (a.latitude ?? 0) - (b.latitude ?? 0));
    return withPoint[0]?.name ?? "";
  });
}

async function openGroupRow(page: Page, name: string) {
  const row = page.locator(".sheet-row").filter({ hasText: name }).first();
  if (await row.count() === 0) {
    const unreached = page.getByRole("button", { name: "Unreached only" });
    if (await unreached.getAttribute("class").then((value) => value?.includes("is-on"))) {
      await unreached.click();
    }
  }
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.scrollIntoViewIfNeeded();
  await row.click();
}

async function waitForMapIdle(page: Page) {
  await page.waitForFunction(() => Boolean(window.__ATLAS_MAP__), { timeout: 20_000 });
  await page.evaluate(() => new Promise<void>((resolve) => {
    const map = window.__ATLAS_MAP__;
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
    if (!map.isMoving() && !map.isZooming()) window.setTimeout(finish, 200);
  }));
}

test.describe("desktop group popover", () => {
  test("keeps Pray and Ask on-screen at 1280 and 1440", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "popover is desktop-only");
    for (const size of [
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(size);
      await waitForCatalog(page);
      const name = await nameForBottomGroup(page);
      expect(name, `no people group found at ${size.width}px`).not.toBe("");
      await openGroupRow(page, name);
      const dock = page.getByTestId("group-dock");
      await expect(dock).toBeVisible();
      await waitForMapIdle(page);
      const pray = dock.getByRole("link", { name: "Pray" });
      const ask = dock.getByRole("button", { name: "Ask" });
      await expect(pray).toBeVisible();
      await expect(ask).toBeVisible();
      const prayBox = await pray.boundingBox();
      const askBox = await ask.boundingBox();
      expect(prayBox, `Pray missing at ${size.width}px`).not.toBeNull();
      expect(askBox, `Ask missing at ${size.width}px`).not.toBeNull();
      if (!prayBox || !askBox) return;
      expect(fullyInViewport(prayBox, size), `Pray clipped at ${size.width}px for ${name}`).toBe(true);
      expect(fullyInViewport(askBox, size), `Ask clipped at ${size.width}px for ${name}`).toBe(true);
    }
  });

  test("lists the US count, not the first group name", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "desktop list header");
    await waitForCatalog(page);
    const header = page.locator(".sheet-head .list-count");
    await expect(header).toHaveText(/\d+ groups in the United States/);
    await expect(header).not.toHaveText(/French Canadians/);
    const first = page.locator(".sheet-row").nth(1);
    await first.click();
    await expect(header).toHaveText(/\d+ groups in the United States/);
    await page.locator(".atlas-toggle").getByRole("button", { name: "World" }).click();
    await expect(header).toHaveText(/^\d+ groups$/);
    const toggle = page.locator(".atlas-toggle");
    const note = page.locator(".world-note");
    await expect(note).toBeVisible();
    const toggleBox = await toggle.boundingBox();
    const noteBox = await note.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(noteBox).not.toBeNull();
    if (!toggleBox || !noteBox) return;
    expect(noteBox.y - (toggleBox.y + toggleBox.height)).toBeGreaterThanOrEqual(7);
  });
});
