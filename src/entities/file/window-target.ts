import { ContentTypes, getContentTypes } from "@/entities/content/extension";
import type { FileType } from "@/entities/file";
import { BackendFileType, VirtualFileType } from "@/entities/file";
import { WindowType } from "@/entities/window";

export function getWindowType(
  fileType: FileType,
  fileName: string
): WindowType | null {
  switch (fileType) {
    case BackendFileType.Directory:
    case VirtualFileType.Root:
    case VirtualFileType.Home:
      return WindowType.Navigator;
    case BackendFileType.Object:
    case BackendFileType.Regular: {
      const contentType = getContentTypes(fileName);
      switch (contentType) {
        case ContentTypes.Image:
          return WindowType.Image;
        case ContentTypes.Video:
          return WindowType.Video;
        case ContentTypes.Audio:
          return WindowType.Audio;
        default:
          return null;
      }
    }
    case VirtualFileType.Upload:
      return WindowType.Uploader;
    default:
      return null;
  }
}

export function isDragTarget(fileType: FileType): boolean {
  return (
    fileType === BackendFileType.Directory ||
    fileType === VirtualFileType.Root ||
    fileType === VirtualFileType.Home
  );
}

export function isSelectable(fileType: FileType): boolean {
  return (
    fileType === BackendFileType.Directory ||
    fileType === BackendFileType.Object ||
    fileType === BackendFileType.Regular ||
    fileType === BackendFileType.Symlink
  );
}
