import "@testing-library/dom";

// jsdom 22+ exposes globalThis.crypto.randomUUID; older versions may not.
// Provide a minimal fallback when missing so factories etc. can call
// crypto.randomUUID() during tests.
if (typeof globalThis.crypto === "undefined") {
  let counter = 0;
  (globalThis as { crypto?: { randomUUID: () => string } }).crypto = {
    randomUUID: () => `id-${counter++}`,
  };
}
