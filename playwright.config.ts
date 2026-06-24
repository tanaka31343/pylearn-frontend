import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/screenshots",
  fullyParallel: false,
  retries: 0,
  reporter: [["html", { outputFolder: "e2e/report", open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "on",
    trace: "on",
    video: "off",
    locale: "ja-JP",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
