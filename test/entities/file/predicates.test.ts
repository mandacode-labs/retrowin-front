import { describe, expect, it } from "vitest";
import {
  BackendFileType,
  isDirectory,
  isRegular,
  isSymlink,
  S_IFDIR,
  S_IFREG,
} from "@/entities/file";

describe("file entity predicates", () => {
  it("isDirectory matches S_IFDIR", () => {
    expect(isDirectory(0o040755)).toBe(true);
    expect(isDirectory(0o100644)).toBe(false);
    expect(isDirectory(undefined)).toBe(false);
  });

  it("isRegular matches S_IFREG", () => {
    expect(isRegular(0o100644)).toBe(true);
    expect(isRegular(S_IFDIR)).toBe(false);
    expect(isRegular(undefined)).toBe(false);
  });

  it("isSymlink matches S_IFLNK", () => {
    expect(isSymlink(0o120777)).toBe(true);
    expect(isSymlink(S_IFREG)).toBe(false);
    expect(isSymlink(undefined)).toBe(false);
  });

  it("BackendFileType.Directory === 'directory'", () => {
    expect(BackendFileType.Directory).toBe("directory");
  });
});
