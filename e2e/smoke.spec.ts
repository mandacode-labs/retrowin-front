import { expect, test } from "@playwright/test";

// Skipped by default because a valid Zitadel session is required.
// Run manually against an authenticated session:
//
//   MDrive_E2E_AUTH_TOKEN="..." npm run test:e2e -- smoke.spec.ts
//
// CI should only enable this when MDrive_E2E_AUTH_TOKEN is configured.

test.skip("smoke — page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MDrive/);
});
