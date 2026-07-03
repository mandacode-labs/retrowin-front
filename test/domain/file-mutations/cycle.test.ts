import { describe, expect, it } from "vitest";
import { partitionCycled, wouldCycle } from "@/domain/file-mutations/cycle";

describe("wouldCycle", () => {
  it("returns false when destination is root", () => {
    expect(wouldCycle(["/a"], "/")).toBe(false);
    expect(wouldCycle(["/a"], "")).toBe(false);
  });

  it("returns true when source equals destination", () => {
    expect(wouldCycle(["/a"], "/a")).toBe(true);
  });

  it("returns true when destination is a descendant of a source directory", () => {
    expect(wouldCycle(["/a"], "/a/b")).toBe(true);
    expect(wouldCycle(["/a/b"], "/a/b/c/d")).toBe(true);
  });

  it("returns false when destination is a sibling of source", () => {
    expect(wouldCycle(["/a"], "/b")).toBe(false);
    expect(wouldCycle(["/a/b"], "/a/c")).toBe(false);
  });

  it("returns false when destination is an ancestor of source", () => {
    expect(wouldCycle(["/a/b"], "/")).toBe(false);
    expect(wouldCycle(["/a/b/c"], "/a")).toBe(false);
  });

  it("returns true if any source would cycle", () => {
    expect(wouldCycle(["/x", "/a"], "/a/y")).toBe(true);
  });
});

describe("partitionCycled", () => {
  it("rejects all when destination would cycle", () => {
    const result = partitionCycled(["/a"], "/a/b");
    expect(result.safe).toEqual([]);
    expect(result.rejected).toEqual(["/a"]);
  });

  it("keeps all when destination is safe", () => {
    const result = partitionCycled(["/a", "/b"], "/c");
    expect(result.safe).toEqual(["/a", "/b"]);
    expect(result.rejected).toEqual([]);
  });
});
