import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });
test.skip(!process.env.MDrive_E2E_AUTH_TOKEN, "requires MDRIVE_E2E_AUTH_TOKEN");

test("create a new drive", async ({ page, request }) => {
  await request.post("/api/auth/login", {
    headers: { Cookie: process.env.MDrive_E2E_AUTH_TOKEN ?? "" },
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Add new drive" }).click();
  await page.getByLabel("Drive Name").fill("e2e-drive");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(
    page.getByRole("button", { name: /Select e2e-drive/ })
  ).toBeVisible({
    timeout: 10_000,
  });
});
