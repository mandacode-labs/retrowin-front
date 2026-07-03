import type { FileType } from "@/entities/file";
import { BackendFileType } from "@/entities/file";
import type { DirEntry } from "@/infra/http/generated/model/dirEntry";

export function getFileTypeFromEntry(entry: DirEntry): FileType {
  switch (entry.type) {
    case BackendFileType.Directory:
      return BackendFileType.Directory;
    case BackendFileType.Symlink:
      return BackendFileType.Symlink;
    case BackendFileType.Object:
      return BackendFileType.Object;
    case BackendFileType.Regular:
      return BackendFileType.Regular;
    default:
      return BackendFileType.Regular;
  }
}
