import { test, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

// axe-core sweep of the three entry surfaces. Asserts zero
// serious/critical violations; moderate/minor findings are logged for
// triage without blocking.
test.describe("accessibility (axe-core)", () => {
  async function axeCheck(page: Page, label: string) {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(v => v.impact === "critical" || v.impact === "serious");
    const advisory = results.violations.filter(v => v.impact === "moderate" || v.impact === "minor");
    if (advisory.length) {
      console.log(`[a11y:${label}] ${advisory.length} advisory finding(s):`,
        advisory.map(v => v.id).join(", "));
    }
    expect(blocking, `[${label}] serious/critical violations: ${
      blocking.map(v => `${v.id}(${v.nodes.length})`).join(", ")
    }`).toHaveLength(0);
  }

  test("title screen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("play-solo")).toBeVisible();
    await axeCheck(page, "title");
  });

  test("level select", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("play-solo").click();
    await expect(page.getByTestId("level-pft-01")).toBeVisible();
    await axeCheck(page, "level-select");
  });

  test("PFT-01 scene", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("play-solo").click();
    await page.getByTestId("level-pft-01").click();
    await expect(page.getByTestId("move-counter")).toBeVisible();
    await axeCheck(page, "pft-01-scene");
  });
});
