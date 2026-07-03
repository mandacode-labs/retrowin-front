"use client";

import { useCallback } from "react";
import { useMkdir } from "@/domain/file-mutations";
import { WindowType } from "@/entities/window";
import { joinPath } from "@/infra/path";
import { useWindowStore } from "@/infra/stores";
import MenuList from "./menu-list";

const NEW_FOLDER_NAME = "New Folder";

export default function BackgroundMenu({
  path,
  driveID,
  closeMenu,
}: {
  path: string;
  driveID: string;
  closeMenu: () => void;
}) {
  const newWindow = useWindowStore((s) => s.newWindow);
  const mkdir = useMkdir();

  const handleUpload = useCallback(() => {
    if (path) {
      newWindow({
        targetKey: path,
        type: WindowType.Uploader,
        title: "Uploader",
        driveID,
      });
      closeMenu();
    }
  }, [path, driveID, newWindow, closeMenu]);

  const handleCreateFolder = useCallback(async () => {
    if (!path || !driveID) {
      closeMenu();
      return;
    }
    const folderPath = joinPath(path, NEW_FOLDER_NAME);
    closeMenu();
    try {
      await mkdir.run({ driveID, data: { path: folderPath } });
    } catch {
      // toast already shown by useSafeMutation
    }
  }, [path, driveID, mkdir, closeMenu]);

  const handleRefresh = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  return (
    <MenuList
      menuList={[
        { name: "Upload", action: handleUpload },
        { name: "Create Folder", action: handleCreateFolder },
        { name: "/", action: () => {} },
        { name: "Refresh", action: handleRefresh },
      ]}
    />
  );
}
