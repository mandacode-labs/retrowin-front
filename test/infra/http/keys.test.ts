import type { Query } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { isFsQuery } from "@/core/http/keys";

function makeQuery(key: ReadonlyArray<unknown>): Query {
  return {
    queryKey: key,
    queryHash: "",
    options: { queryKey: key } as Query["options"],
    state: {} as Query["state"],
  } as unknown as Query;
}

describe("isFsQuery", () => {
  it("matches generated ls keys", () => {
    const q = makeQuery([
      "https://api.mdrive.mandacode.com/v1/drives/d-123/fs/ls",
      { path: "/" },
    ]);
    expect(isFsQuery(q)).toBe(true);
  });

  it("matches generated stat keys", () => {
    const q = makeQuery([
      "https://api.mdrive.mandacode.com/v1/drives/d-123/fs/stat",
      { path: "/a" },
    ]);
    expect(isFsQuery(q)).toBe(true);
  });

  it("does not match drives list key (no /fs/ls or /fs/stat)", () => {
    const q = makeQuery(["https://api.mdrive.mandacode.com/v1/drives"]);
    expect(isFsQuery(q)).toBe(false);
  });

  it("does not match unrelated hosts", () => {
    const q = makeQuery(["https://example.com/v1/drives/d-123/fs/ls"]);
    expect(isFsQuery(q)).toBe(false);
  });
});
