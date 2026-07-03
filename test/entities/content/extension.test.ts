import { describe, expect, it } from "vitest";
import { ContentTypes } from "@/entities/content";
import { getContentTypes } from "@/entities/content/extension";

describe("content extension mapping", () => {
  it("returns Unknown for missing extension", () => {
    expect(getContentTypes("README")).toBe(ContentTypes.Unknown);
  });

  it("classifies common types", () => {
    expect(getContentTypes("a.png")).toBe(ContentTypes.Image);
    expect(getContentTypes("a.mp4")).toBe(ContentTypes.Video);
    expect(getContentTypes("a.mp3")).toBe(ContentTypes.Audio);
  });

  it("falls back to Unknown for unsupported extensions", () => {
    expect(getContentTypes("archive.zip")).toBe(ContentTypes.Unknown);
  });

  it("is case-insensitive", () => {
    expect(getContentTypes("COVER.JPG")).toBe(ContentTypes.Image);
  });
});
