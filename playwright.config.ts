import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5710';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Preferir preview (sin file watcher) si no hay servidor ya levantado
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: 'pnpm --filter @enlace/web preview --host 127.0.0.1 --port 5710',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
