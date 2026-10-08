import { expect, test } from "@playwright/test";

test("solo L1 opens with a populated isometric canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Play solo/ }).click();
  await expect(page.getByRole("heading", { name: "Choose a crossing" })).toBeVisible();
  await page.getByTestId("level-L1").click();
  await expect(page.getByTestId("game-timer")).toBeVisible();

  const canvas = page.locator(".playfield-canvas canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator(".playfield-canvas")).toHaveAttribute("data-ready", "true");
  await expect.poll(async () => canvas.evaluate((element) => {
    const surface = element as HTMLCanvasElement;
    const gl = surface.getContext("webgl2") ?? surface.getContext("webgl");
    if (!gl) return 0;
    gl.finish();
    const colors = new Set<string>();
    const pixel = new Uint8Array(4);
    const stepX = Math.max(1, Math.floor(surface.width / 18));
    const stepY = Math.max(1, Math.floor(surface.height / 12));
    for (let y = stepY; y < surface.height; y += stepY) {
      for (let x = stepX; x < surface.width; x += stepX) {
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        if (pixel[3] !== 0) colors.add(`${pixel[0]},${pixel[1]},${pixel[2]}`);
      }
    }
    return colors.size;
  })).toBeGreaterThan(8);
});
