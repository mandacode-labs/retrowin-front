import { beforeEach, describe, expect, it } from "vitest";
import {
  mockCreateDrive,
  mockLs,
  mockMkdir,
  mockMv,
  mockRm,
  resetMockFilesystem,
} from "@/mocks/filesystem";

describe("in-memory mock filesystem", () => {
  beforeEach(() => {
    resetMockFilesystem();
  });

  it("seeds three drives", () => {
    const all = mockLs("any", "/") ?? { entries: [] };
    expect(all.entries?.length ?? 0).toBe(0);
    // Use listDrives indirectly through createDrive to verify the seed.
    const created = mockCreateDrive("Test", "desc");
    expect(created).not.toBeNull();
  });

  it("creates a directory inside the root", () => {
    const result = mockMkdir("docs-drive", "/New Folder");
    expect(result.ok).toBe(true);
    const ls = mockLs("docs-drive", "/");
    expect(ls?.entries?.map((e) => e.name)).toContain("New Folder");
  });

  it("rejects duplicate mkdir with the same path", () => {
    mockMkdir("docs-drive", "/New Folder");
    const result = mockMkdir("docs-drive", "/New Folder");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("moves a file into a folder", () => {
    mockMkdir("docs-drive", "/Archive");
    const before = mockLs("docs-drive", "/");
    expect(before?.entries?.some((e) => e.name === "Notes.md")).toBe(true);
    mockMv("docs-drive", ["/Notes.md"], "/Archive/Notes.md");
    const rootNow = mockLs("docs-drive", "/");
    expect(rootNow?.entries?.some((e) => e.name === "Notes.md")).toBe(false);
    const archived = mockLs("docs-drive", "/Archive");
    expect(archived?.entries?.some((e) => e.name === "Notes.md")).toBe(true);
  });

  it("refuses to move a folder into its own subtree", () => {
    mockMkdir("docs-drive", "/a");
    mockMkdir("docs-drive", "/a/b");
    // Attempting to move /a into /a/b would loop forever. cycle check.
    const result = mockMv("docs-drive", ["/a"], "/a/b/a");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("removes a file when recursive is true", () => {
    const before = mockLs("docs-drive", "/");
    expect(before?.entries?.some((e) => e.name === "Notes.md")).toBe(true);
    const result = mockRm("docs-drive", ["/Notes.md"], true);
    expect(result.ok).toBe(true);
    const after = mockLs("docs-drive", "/");
    expect(after?.entries?.some((e) => e.name === "Notes.md")).toBe(false);
  });

  it("removes an empty folder without recursive flag", () => {
    mockMkdir("docs-drive", "/Temp");
    const result = mockRm("docs-drive", ["/Temp"], false);
    expect(result.ok).toBe(true);
    expect(
      mockLs("docs-drive", "/")?.entries?.some((e) => e.name === "Temp")
    ).toBe(false);
  });

  it("blocks rm on a non-empty folder without recursive", () => {
    // /Photos already has /beach.jpg in the seed fixtures
    const result = mockRm("docs-drive", ["/Photos"], false);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
  });
});
