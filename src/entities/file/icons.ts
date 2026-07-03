import { ContentTypes, getContentTypes } from "@/entities/content/extension";
import type { FileType } from "@/entities/file";
import {
  BackendFileType,
  FileIconType,
  VirtualFileType,
} from "@/entities/file";

export function getIconType(
  fileType: FileType,
  fileName?: string
): FileIconType {
  switch (fileType) {
    case BackendFileType.Directory:
      return FileIconType.Directory;
    case BackendFileType.Symlink:
      return FileIconType.Regular;
    case BackendFileType.Object:
    case BackendFileType.Regular:
      if (fileName) {
        const contentType = getContentTypes(fileName);
        switch (contentType) {
          case ContentTypes.Image:
            return FileIconType.Image;
          case ContentTypes.Video:
            return FileIconType.Video;
          case ContentTypes.Audio:
            return FileIconType.Audio;
        }
      }
      return fileType === BackendFileType.Object
        ? FileIconType.Object
        : FileIconType.Regular;
    case VirtualFileType.Home:
      return FileIconType.Home;
    case VirtualFileType.Upload:
      return FileIconType.Upload;
    case VirtualFileType.Root:
      return FileIconType.Directory;
    default:
      return FileIconType.Regular;
  }
}

export function getFileTypeSortOrder(fileType: FileType): number {
  switch (fileType) {
    case BackendFileType.Directory:
      return 0;
    case BackendFileType.Object:
      return 1;
    case BackendFileType.Regular:
      return 2;
    case BackendFileType.Symlink:
      return 3;
    default:
      return 4;
  }
}
