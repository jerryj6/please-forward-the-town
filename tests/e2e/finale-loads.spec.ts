// Finale smoke: PFT-11 and PFT-12 load their boards in the live client —
// scene + ledger + hints render, zero page errors.
import { expect, test } from "@playwright/test";

for (const id of ["pft-11", "pft-12"]) {
  test(`${id} board loads clean`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByTestId("play-solo").click();
    await page.getByTestId(`level-${id}`).click();
    await expect(page.getByTestId("scene")).toBeVisible();
    await expect(page.getByRole("region", { name: "Order ledger" })).toBeVisible();
    await expect(page.getByTestId("hint-1")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
