import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const screenshots = "/Users/devin/coordination/pft-rt-shots";
const waypointTolerance = 250;

async function moveAlongX(page: Page, tile: number): Promise<void> {
  const position = await page.getByTestId("courier-solo").getAttribute("data-position");
  const [x] = (position ?? "").split(",").map(Number);
  const keys = [tile * 1000 + 500 < x! ? "ArrowLeft" : "ArrowRight"];
  for (const key of keys) await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const position = await page.getByTestId("courier-solo").getAttribute("data-position");
      const [x, y] = (position ?? "").split(",").map(Number);
      const reached = Math.abs(x! - (tile * 1000 + 500)) < waypointTolerance
        && Math.abs(y! - 3500) < waypointTolerance;
      return `${reached}:${position}`;
    }, { timeout: 8_000, intervals: [10] }).toMatch(/^true:/);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

async function moveAlongY(page: Page, tile: number, xTile: number): Promise<void> {
  const position = await page.getByTestId("courier-solo").getAttribute("data-position");
  const [, y] = (position ?? "").split(",").map(Number);
  const keys = [tile * 1000 + 500 < y! ? "ArrowUp" : "ArrowDown"];
  for (const key of keys) await page.keyboard.down(key);
  try {
    await expect.poll(async () => {
      const position = await page.getByTestId("courier-solo").getAttribute("data-position");
      const [x, y] = (position ?? "").split(",").map(Number);
      const reached = Math.abs(x! - (xTile * 1000 + 500)) < waypointTolerance
        && Math.abs(y! - (tile * 1000 + 500)) < waypointTolerance;
      return `${reached}:${position}`;
    }, { timeout: 8_000, intervals: [10] }).toMatch(/^true:/);
  } finally {
    for (const key of keys) await page.keyboard.up(key);
  }
}

async function liftPlank(page: Page): Promise<void> {
  await page.keyboard.down("ArrowLeft");
  await page.keyboard.press("Space");
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

  await moveAlongX(page, 3);
  await moveAlongY(page, 2, 3);
  await page.keyboard.press("Space");
  await expect(page.locator(".touch-action")).toHaveClass(/carrying/);
  await moveAlongY(page, 3, 3);
  await moveAlongX(page, 14);
  await moveAlongY(page, 2, 14);
  await page.keyboard.press("Space");
  await expect(page.locator(".order-chip").filter({ hasText: "Orchard" })).toHaveClass(/done/);

  await moveAlongY(page, 3, 14);
  await moveAlongX(page, 7);
  await liftPlank(page);
  await expect(page.locator(".touch-action")).toHaveClass(/carrying/);
  await page.screenshot({ path: `${screenshots}/mid-carry.png` });
  await moveAlongX(page, 14);
  await moveAlongY(page, 4, 14);
  await page.keyboard.press("Space");
  await expect(page.locator(".order-chip").filter({ hasText: "Museum" })).toHaveClass(/done/);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("ArrowDown");
  await expect(page.getByRole("heading", { name: "Town, taken care of." })).toBeVisible({ timeout: 8_000 });
  await page.keyboard.up("ArrowDown");
  await page.keyboard.up("ArrowRight");
  await page.screenshot({ path: `${screenshots}/results.png` });
});
