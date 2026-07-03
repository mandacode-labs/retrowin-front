import { setupWorker } from "msw/browser";

import { getMdriveAPIMock } from "@/infra/http/generated/index.msw";

const worker = setupWorker(...getMdriveAPIMock());

let workerStarted = false;

export async function startWorker() {
  if (workerStarted) return;
  workerStarted = true;
  await worker.start({ onUnhandledRequest: "bypass" });
}
