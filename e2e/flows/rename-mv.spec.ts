import { test } from "@playwright/test";

test.skip(!process.env.MDrive_E2E_AUTH_TOKEN, "requires MDRIVE_E2E_AUTH_TOKEN");
test.skip("rename/mv reflects in listing", async () => {
  // placeholder
});
