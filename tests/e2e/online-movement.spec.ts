import { expect, test } from "@playwright/test";

test("a guest courier moves in the host's live room", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  await host.goto("/");
  await host.getByRole("button", { name: /Crew up/ }).click();
  await host.getByLabel("Your courier name").fill("Host");
  await host.getByRole("button", { name: /Host a crew/ }).click();
  const roomHeading = host.getByRole("heading", { name: /^Dock / });
  await expect(roomHeading).toBeVisible();
  const code = (await roomHeading.innerText()).replace("Dock ", "").trim();

  await guest.goto(`/?room=${code}`);
  await guest.getByLabel("Your courier name").fill("Guest");
  await guest.getByRole("button", { name: /Join crew/ }).click();
  await expect(host.getByText("Guest", { exact: true })).toBeVisible();
  await host.getByRole("button", { name: /Start crossing/ }).click();
  await expect(host.locator(".playfield-canvas canvas")).toBeVisible();
  await expect(guest.locator(".playfield-canvas canvas")).toBeVisible();

  const guestCourier = host.locator(".roster-chip").filter({ hasText: "Guest" });
  const guestSelf = guest.locator(".roster-chip").filter({ hasText: "Guest" });
  await expect(guestCourier).toBeVisible();
  const beforeRemote = await guestCourier.getAttribute("data-position");
  const beforeLocal = await guestSelf.getAttribute("data-position");
  await guest.keyboard.down("ArrowRight");
  await guest.keyboard.down("ArrowDown");
  try {
    await expect.poll(() => guestSelf.getAttribute("data-position"), { timeout: 5_000 }).not.toBe(beforeLocal);
  } finally {
    await guest.keyboard.up("ArrowRight");
    await guest.keyboard.up("ArrowDown");
  }
  await expect.poll(() => guestCourier.getAttribute("data-position"), { timeout: 5_000 }).not.toBe(beforeRemote);

  await hostContext.close();
  await guestContext.close();
});
