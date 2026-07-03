"use client";

import { useCallback } from "react";
import { presignDownload } from "@/core/http";
import { useFileStore, useWindowStore } from "@/core/stores";
import { useRm } from "@/domain/file-mutations";
import { ContentTypes, getContentTypes } from "@/entities/content/extension";
import {
  BackendFileType,
  type FileType,
  VirtualFileType,
} from "@/entities/file";
import { WindowType } from "@/entities/window";
import MenuList from "./menu-list";

export default function FileMenu({
  path,
  fileType,
  fileName,
  windowKey,
  closeMenu,
}: {
  path: string;
  fileType: FileType;
  fileName: string;
  windowKey: string;
  closeMenu: () => void;
}) {
  const windows = useWindowStore((s) => s.windows);
  const currentWindow = windows.find((w) => w.key === windowKey);
  const driveID = currentWindow?.driveID || "";

  const rm = useRm();
  const newWindow = useWindowStore((s) => s.newWindow);
  const getSelectedFileKeys = useFileStore((s) => s.getSelectedFileKeys);
  const setRenamingFile = useFileStore((s) => s.setRenamingFile);

  const getTargetPaths = useCallback(() => {
    const selected = getSelectedFileKeys();
    if (!selected.includes(path)) return [path];
    return selected;
  }, [getSelectedFileKeys, path]);

  const openFile = useCallback(
    async (
      type: Omit<FileType, BackendFileType.Symlink>,
      name: string,
      targetPath: string
    ) => {
      let kind: WindowType;
      switch (type) {
        case BackendFileType.Directory:
        case VirtualFileType.Root:
        case VirtualFileType.Home:
          kind = WindowType.Navigator;
          break;
        case BackendFileType.Object:
        case BackendFileType.Regular: {
          const ct = getContentTypes(name);
          switch (ct) {
            case ContentTypes.Image:
              kind = WindowType.Image;
              break;
            case ContentTypes.Video:
              kind = WindowType.Video;
              break;
            case ContentTypes.Audio:
              kind = WindowType.Audio;
              break;
            default:
              kind = WindowType.Other;
              break;
          }
          break;
        }
        case VirtualFileType.Upload:
          kind = WindowType.Uploader;
          break;
        default:
          kind = WindowType.Other;
      }
      newWindow({
        targetKey: targetPath,
        type: kind,
        title: name,
        driveID,
      });
    },
    [newWindow, driveID]
  );

  const handleOpen = useCallback(async () => {
    closeMenu();
    await openFile(fileType, fileName, path);
  }, [closeMenu, fileName, fileType, path, openFile]);

  const handleRename = useCallback(() => {
    closeMenu();
    setRenamingFile({ fileKey: path, windowKey });
  }, [closeMenu, path, windowKey, setRenamingFile]);

  const handleDownload = useCallback(async () => {
    closeMenu();
    try {
      const result = await presignDownload(driveID, { path });
      if (result.status !== 200 || !result.data?.url) return;
      const response = await fetch(result.data.url);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[FileMenu] download failed:", error);
    }
  }, [closeMenu, driveID, path, fileName]);

  const handleDelete = useCallback(async () => {
    closeMenu();
    const targets = getTargetPaths();
    try {
      await rm.run({ driveID, data: { paths: targets, recursive: true } });
    } catch {
      // useRm surfaces the failure via the toast; menu is already closed
    }
  }, [closeMenu, getTargetPaths, driveID, rm]);

  const handleInfo = useCallback(() => {
    closeMenu();
    newWindow({
      targetKey: path,
      type: WindowType.Info,
      title: `${fileName} Info`,
      driveID,
    });
  }, [closeMenu, newWindow, path, fileName, driveID]);

  switch (fileType) {
    case BackendFileType.Directory:
    case VirtualFileType.Root:
    case VirtualFileType.Home:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Object:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Download", action: handleDownload },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Regular:
      return (
        <MenuList
          menuList={[
            { name: "Download", action: handleDownload },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case BackendFileType.Symlink:
      return (
        <MenuList
          menuList={[
            { name: "Open", action: handleOpen },
            { name: "Info", action: handleInfo },
            { name: "Rename", action: handleRename },
            { name: "/", action: () => {} },
            { name: "Delete", action: handleDelete },
          ]}
        />
      );
    case VirtualFileType.Upload:
      return <MenuList menuList={[{ name: "Open", action: handleOpen }]} />;
    default:
      return null;
  }
}
