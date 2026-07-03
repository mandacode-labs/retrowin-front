import { describe, expect, it } from "vitest";
import { basename, dirname, joinPath, normalize } from "@/core/path";

describe("path helpers", () => {
  it("joins root and child", () => {
    expect(joinPath("/", "a")).toBe("/a");
    expect(joinPath("", "a")).toBe("/a");
    expect(joinPath("/dir/", "a")).toBe("/dir/a");
  });

  it("normalizes redundant separators and dot segments", () => {
    expect(normalize("/")).toBe("/");
    expect(normalize("//a//b/")).toBe("/a/b");
    expect(normalize("/a/./b/../c")).toBe("/a/c");
  });

  it("returns dirname/basename for paths", () => {
    expect(dirname("/a/b/c.txt")).toBe("/a/b");
    expect(dirname("/")).toBe("/");
    expect(basename("/a/b/c.txt")).toBe("c.txt");
    expect(basename("/")).toBe("");
  });
});
