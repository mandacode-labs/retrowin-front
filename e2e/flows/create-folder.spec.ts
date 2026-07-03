import { test } from "@playwright/test";

test.skip(!process.env.MDrive_E2E_AUTH_TOKEN, "requires MDRIVE_E2E_AUTH_TOKEN");
test.skip("create folder appears in listing", async () => {
  // placeholder; expand against authenticated session
});
