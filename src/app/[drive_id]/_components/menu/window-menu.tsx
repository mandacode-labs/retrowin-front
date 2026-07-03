"use client";

import { useCallback } from "react";
import { useMkdir } from "@/domain/file-mutations";
import { WindowType } from "@/entities/window";
import { joinPath } from "@/infra/path";
import { useWindowStore } from "@/infra/stores";
import MenuList from "./menu-list";

export default function WindowMenu({
  path,
  windowType,
  closeMenu,
}: {
  path: string;
  windowType: WindowType | null;
  closeMenu: () => void;
}) {
  const windows = useWindowStore((s) => s.windows);
  const currentWindow = windows.find((w) => w.targetKey === path);
  const driveID = currentWindow?.driveID || "";
  const newWindow = useWindowStore((s) => s.newWindow);
  const mkdir = useMkdir();

  const handleUpload = useCallback(() => {
    newWindow({
      targetKey: path,
      type: WindowType.Uploader,
      title: "Uploader",
      driveID,
    });
    closeMenu();
  }, [closeMenu, newWindow, path, driveID]);

  const handleCreateFolder = useCallback(async () => {
    if (!path || !driveID) {
      closeMenu();
      return;
    }
    const folderPath = joinPath(path, "New Folder");
    closeMenu();
    // The mkdir hook emits a toast on failure and an fs invalidation
    // on success. Errors are swallowed here intentionally — the user
    // is already informed. closeMenu runs up-front so the menu does
    // not get stuck open on a slow or rejected request.
    try {
      await mkdir.run({ driveID, data: { path: folderPath } });
    } catch {
      // ignored
    }
  }, [path, driveID, mkdir, closeMenu]);

  const handleRefresh = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  switch (windowType) {
    case WindowType.Navigator:
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
    default:
      return null;
  }
}
