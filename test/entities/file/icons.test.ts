import { describe, expect, it } from "vitest";
import {
  BackendFileType,
  FileIconType,
  VirtualFileType,
} from "@/entities/file";
import { getFileTypeSortOrder, getIconType } from "@/entities/file/icons";
import {
  getWindowType,
  isDragTarget,
  isSelectable,
} from "@/entities/file/window-target";
import { WindowType } from "@/entities/window";

describe("file icons mapping", () => {
  it("returns Directory icon for directory entries", () => {
    expect(getIconType(BackendFileType.Directory)).toBe(FileIconType.Directory);
  });

  it("sniffs Image/Video/Audio from filename", () => {
    expect(getIconType(BackendFileType.Regular, "photo.png")).toBe(
      FileIconType.Image
    );
    expect(getIconType(BackendFileType.Regular, "clip.mp4")).toBe(
      FileIconType.Video
    );
    expect(getIconType(BackendFileType.Regular, "song.mp3")).toBe(
      FileIconType.Audio
    );
  });

  it("falls back to Regular for unknown extensions", () => {
    expect(getIconType(BackendFileType.Regular, "notes.txt")).toBe(
      FileIconType.Regular
    );
  });

  it("maps sort order with directories first", () => {
    expect(getFileTypeSortOrder(BackendFileType.Directory)).toBeLessThan(
      getFileTypeSortOrder(BackendFileType.Regular)
    );
    expect(getFileTypeSortOrder(BackendFileType.Object)).toBeLessThan(
      getFileTypeSortOrder(BackendFileType.Symlink)
    );
  });
});

describe("file window-target mapping", () => {
  it("directory opens navigator window", () => {
    expect(getWindowType(BackendFileType.Directory, "any")).toBe(
      WindowType.Navigator
    );
  });

  it("image extension opens image window", () => {
    expect(getWindowType(BackendFileType.Regular, "a.jpg")).toBe(
      WindowType.Image
    );
  });

  it("text returns null (no window)", () => {
    expect(getWindowType(BackendFileType.Regular, "notes.txt")).toBeNull();
  });

  it("virtual Upload opens uploader", () => {
    expect(getWindowType(VirtualFileType.Upload, "x")).toBe(
      WindowType.Uploader
    );
  });

  it("drag target includes directory and root/home virtuals", () => {
    expect(isDragTarget(BackendFileType.Directory)).toBe(true);
    expect(isDragTarget(VirtualFileType.Root)).toBe(true);
    expect(isDragTarget(VirtualFileType.Home)).toBe(true);
    expect(isDragTarget(VirtualFileType.Upload)).toBe(false);
  });

  it("selectable covers the four backend types", () => {
    expect(isSelectable(BackendFileType.Regular)).toBe(true);
    expect(isSelectable(BackendFileType.Object)).toBe(true);
    expect(isSelectable(BackendFileType.Directory)).toBe(true);
    expect(isSelectable(BackendFileType.Symlink)).toBe(true);
    expect(isSelectable(VirtualFileType.Upload)).toBe(false);
  });
});
