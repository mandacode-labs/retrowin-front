import { test } from "@playwright/test";

test.skip(!process.env.MDrive_E2E_AUTH_TOKEN, "requires MDRIVE_E2E_AUTH_TOKEN");
test.skip("remove deletes from listing", async () => {
  // placeholder
});
