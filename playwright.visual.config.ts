import { defineConfig } from "@playwright/test";

// Visual baselines: title screen, level select, and the PFT-01 scene.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "visual.spec.ts",
  use: { baseURL: "http://localhost:4173" },
  webServer: { command: "npx vite preview --port 4173", port: 4173, reuseExistingServer: true },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
