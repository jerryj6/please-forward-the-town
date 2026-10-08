import { test, expect, type Browser } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";

const PORT = 8931;
let srv: ChildProcess;

test.beforeAll(async () => {
  srv = spawn("node", ["dist-server/src/server/main.js"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error("room server did not start");
});

test.afterAll(() => srv.kill());

test("two couriers share one authoritative contract", async ({ browser }: { browser: Browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();

  await host.goto(`http://localhost:${PORT}/`);
  await host.getByTestId("play-coop").click();
  await host.getByText(/Host a room/).click();
  await expect(host.getByText(/Convoy [A-Z0-9]+/)).toBeVisible();
  const code = (await host.locator(".badge", { hasText: "Convoy" }).innerText()).replace("Convoy ", "");

  await guest.goto(`http://localhost:${PORT}/`);
  await guest.getByTestId("play-coop").click();
  await guest.getByPlaceholder("Room code").fill(code);
  await guest.getByText("Join", { exact: true }).click();
  await expect(guest.getByText(new RegExp(`Convoy ${code}`))).toBeVisible();

  // Host commits the first move; guest's move counter ticks via broadcast fold.
  await host.getByTestId("order-travel-to-west").click();
  await expect(guest.getByTestId("move-counter")).toContainText("1 moves", { timeout: 5000 });

  // Guest commits the second move; host sees 2.
  await guest.getByTestId("order-pickup-lantern").click();
  await expect(host.getByTestId("move-counter")).toContainText("2 moves", { timeout: 5000 });

  await host.close(); await guest.close();
});
