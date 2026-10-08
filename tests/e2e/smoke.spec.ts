// Smoke: load → level select → play the level-01 winning input through the
// real UI (the nine-move contract) → assert the success verdict is accepted.
import { expect, test } from "@playwright/test";

test("PFT-01 The Last Crossing — nine-move contract closes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-solo").click();
  await page.getByTestId("level-pft-01").click();

  const orders = [
    "order-travel-to-west",
    "order-pickup-lantern",
    "order-travel-to-middle",
    "order-ride-ferry-1-to-east",
    "order-deliver-lantern-to-orchard",
    "order-ride-ferry-1-to-middle",
    "order-pack-bridge-1",
    "order-ride-ferry-1-to-east",
    "order-deliver-bridge-1-to-museum",
  ];
  for (const id of orders) {
    await page.getByTestId(id).click();
    await expect(page.getByTestId("toast")).toHaveCount(0);
  }

  await expect(page.getByTestId("move-counter")).toContainText("9 moves");
  await page.getByTestId("accept-result").click();
  await expect(page.getByTestId("accepted-banner")).toBeVisible();
});

test("packing the bridge early strands the lantern order", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("play-solo").click();
  await page.getByTestId("level-pft-01").click();

  // Go west, grab the lantern, come back — but pack the bridge while the
  // courier still needs the far bank: the engine must report a stranded order.
  await page.getByTestId("order-pack-bridge-1").click();
  await expect(page.getByTestId("toast")).toHaveCount(0);
  // Lantern order is now unreachable (no route west).
  await expect(page.locator(".orders li.stranded")).toHaveCount(1);
  await expect(page.getByTestId("move-counter")).toContainText("1 moves");
});
