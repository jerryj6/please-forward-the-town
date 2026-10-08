import { defineConfig } from "@playwright/test";

// Accessibility sweep (port of TRS pattern): axe-core across the three
// entry surfaces — title → level select → PFT-01 scene.
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "a11y.spec.ts",
  use: { baseURL: "http://localhost:4173" },
  webServer: { command: "npx vite preview --port 4173", port: 4173, reuseExistingServer: true },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
