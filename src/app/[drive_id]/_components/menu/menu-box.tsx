"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowType } from "@/entities/window";
import { useFileStore, useWindowStore } from "@/infra/stores";
import { useContextMenuState } from "@/interact";
import BackgroundMenu from "./background-menu";
import FileMenu from "./file-menu";
import styles from "./menu-box.module.css";
import WindowMenu from "./window-menu";

export default function MenuBox({ children }: { children: React.ReactNode }) {
  const menu = useContextMenuState();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next = menuRef.current;
    if (!next) return;
    if (menu.phase === "open" && menu.pointer) {
      next.style.left = `${menu.pointer.x}px`;
      next.style.top = `${menu.pointer.y}px`;
      next.style.display = "block";
      setOpen(true);
    } else {
      next.style.display = "none";
      setOpen(false);
    }
  }, [menu]);

  const closeMenu = useCallback(() => {
    if (menuRef.current) menuRef.current.style.display = "none";
    setOpen(false);
    useFileStore.setState({ renamingFileSerial: null });
  }, []);

  return (
    <>
      {children}
      <div
        ref={menuRef}
        className={styles.menu_box}
        style={{ display: "none" }}
        role="menu"
        aria-label="context menu"
      >
        {open ? <MenuContent closeMenu={closeMenu} /> : null}
      </div>
    </>
  );
}

function MenuContent({ closeMenu }: { closeMenu: () => void }) {
  const currentWindow = useWindowStore((s) => s.currentWindow);
  const findWindow = useWindowStore((s) => s.findWindow);
  const getBackgroundWindow = useWindowStore((s) => s.getBackgroundWindow);
  const highlightedFile = useFileStore((s) => s.highlightedFile);

  const target = useMemo(() => {
    if (highlightedFile) {
      return {
        window: findWindow(highlightedFile.windowKey),
        file: highlightedFile,
      };
    }
    const valid =
      currentWindow && findWindow(currentWindow.key)
        ? findWindow(currentWindow.key)
        : getBackgroundWindow();
    return { window: valid ?? null, file: null };
  }, [currentWindow, findWindow, getBackgroundWindow, highlightedFile]);

  if (target.file && target.window) {
    return (
      <FileMenu
        path={target.file.fileKey}
        fileName={target.file.fileName}
        fileType={target.file.type}
        windowKey={target.window.key}
        closeMenu={closeMenu}
      />
    );
  }
  if (!target.window) return null;
  if (target.window.type === WindowType.Background) {
    return (
      <BackgroundMenu
        path={target.window.targetKey}
        driveID={target.window.driveID || ""}
        closeMenu={closeMenu}
      />
    );
  }
  if (target.window.type === WindowType.Navigator) {
    return (
      <WindowMenu
        path={target.window.targetKey}
        windowType={target.window.type}
        closeMenu={closeMenu}
      />
    );
  }
  return null;
}
