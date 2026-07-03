import { describe, expect, it } from "vitest";
import { createWindowKey } from "@/core/random-keys";

describe("createWindowKey", () => {
  it("produces a non-empty unique identifier", () => {
    const a = createWindowKey();
    const b = createWindowKey();
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});
