// Backend file types as returned by DirEntry.kind (string).
export enum BackendFileType {
  Directory = "directory",
  Regular = "regular",
  Symlink = "symlink",
  Object = "object",
  Unknown = "unknown",
}

// UI-only virtual file types (not from API).
export enum VirtualFileType {
  Root = "root",
  Home = "home",
  Upload = "upload",
}

export type FileType = BackendFileType | VirtualFileType;

// Icon types for visual representation
export enum FileIconType {
  Directory = "directory",
  Regular = "regular",
  Object = "object",
  Home = "home",
  Upload = "upload",
  Image = "image",
  Video = "video",
  Audio = "audio",
}

export enum SpecialFileName {
  Root = "root",
  Home = "home",
  Upload = "upload",
}