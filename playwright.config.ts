import { defineConfig } from "@playwright/test";

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  timeout: 60_000,
});
