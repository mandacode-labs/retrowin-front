"use client";

import { setupWorker } from "msw/browser";

import { getMdriveAPIMock } from "@/infra/http/generated/index.msw";
import { customHandlers } from "@/mocks/handlers";

/**
 * MSW dev worker.
 *
 * Routing order matters: in MSW, the LAST registered handler that
 * matches a request wins, so we register our custom handlers last
 * (after the Orval-generated ones). This guarantees that routes we
 * actually exercise (auth/me, drives CRUD, fs ls/mkdir/mv/rm) are
 * served by the in-memory filesystem mock in `mocks/filesystem.ts`.
 * Any URL not handled by `customHandlers` falls through to the
 * generated mocks, which keeps storage/download/upload metadata
 * endpoints from spamming the console with "unhandled request"
 * warnings.
 *
 * The Orval-generated handlers are kept on top — for routes we do
 * NOT cover (presign, write, cat, symlink, hardlink, mount, drive
 * storage) — so the dev session never gets noisy and surface-level
 * mocked responses still work end-to-end.
 */
const worker = setupWorker(...customHandlers, ...getMdriveAPIMock());

let workerStarted = false;

export async function startWorker() {
  if (workerStarted) return;
  workerStarted = true;
  // Re-register our handlers explicitly so a stale SW from an earlier
  // dev session is upgraded in-place. MSW will broadcast the new
  // handler list over its existing channel without needing a fresh
  // service worker registration.
  worker.use(...customHandlers);
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}
