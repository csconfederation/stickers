import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Another session may already hold 4312; override with E2E_PORT.
const PORT = Number(process.env.E2E_PORT ?? 4312)
const BASE_URL = `http://127.0.0.1:${PORT}`
// Serve another checkout of the app (e.g. a refactor worktree) with the same tests.
const APP_DIR = path.resolve(process.env.APP_DIR ?? import.meta.dirname)

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory "${APP_DIR}"`,
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore', // http.server logs every request to stderr
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      grepInvert: /@mobile/,
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
      grepInvert: /@desktop/,
    },
  ],
})
