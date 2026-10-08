import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const screenshots = "/Users/devin/coordination/pft-rt-shots";

async function moveAlongX(page: Page, tile: number): Promise<void> {
  const keys = tile < 6 ? ["ArrowLeft", "ArrowUp"] : ["ArrowRight", "ArrowDown"];
  for (const key of keys) await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const position = await page.getByTestId("courier-solo").getAttribute("data-position");
      const [x, y] = (position ?? "").split(",").map(Number);
      const reached = Math.abs(x! - (tile * 1000 + 500)) < 120 && Math.abs(y! - 3500) < 120;
      return `${reached}:${position}`;
    }, { timeout: 8_000, intervals: [10] }).toMatch(/^true:/);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

async function liftPlank(page: Page): Promise<void> {
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.down("ArrowUp");
  await page.keyboard.press("Space");
  await page.keyboard.up("ArrowUp");
  await page.keyboard.up("ArrowLeft");
}

test("keyboard playthrough completes L1 and captures the milestone screens", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: `${screenshots}/title.png` });

  await page.getByRole("button", { name: /Play solo/ }).click();
  await expect(page.getByRole("heading", { name: "Choose a crossing" })).toBeVisible();
  await page.screenshot({ path: `${screenshots}/level-select.png` });
  await page.getByTestId("level-L1").click();
  await expect(page.getByTestId("game-timer")).toBeVisible();
  await expect(page.locator(".playfield-canvas canvas")).toBeVisible();
  await expect(page.locator(".playfield-canvas")).toHaveAttribute("data-ready", "true");
  await page.screenshot({ path: `${screenshots}/l1-start.png` });

  await moveAlongX(page, 2);
  await page.keyboard.press("Space");
  await expect(page.locator(".touch-action")).toHaveClass(/carrying/);
  await moveAlongX(page, 10);
  await page.keyboard.press("Space");
  await expect(page.locator(".order-chip").filter({ hasText: "Orchard" })).toHaveClass(/done/);

  await moveAlongX(page, 5);
  await liftPlank(page);
  await expect(page.locator(".touch-action")).toHaveClass(/carrying/);
  await page.screenshot({ path: `${screenshots}/mid-carry.png` });
  await moveAlongX(page, 12);
  await page.keyboard.press("Space");
  await expect(page.locator(".order-chip").filter({ hasText: "Museum" })).toHaveClass(/done/);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowDown");
  await expect(page.getByRole("heading", { name: "Town, taken care of." })).toBeVisible({ timeout: 8_000 });
  await page.keyboard.up("ArrowDown");
  await page.keyboard.up("ArrowRight");
  await page.screenshot({ path: `${screenshots}/results.png` });
});
