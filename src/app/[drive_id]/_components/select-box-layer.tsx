"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getWindowConfig } from "@/config/window";
import { WindowType } from "@/entities/window";
import { useEventStore, useFileStore, useWindowStore } from "@/infra/stores";
import styles from "./select-box-layer.module.css";

export default function SelectBoxContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  // Store states
  const highlightedFile = useFileStore((state) => state.highlightedFile);
  const menuRef = useFileStore((state) => state.menuRef);
  const currentWindow = useWindowStore((state) => state.currentWindow);
  const pressedKeys = useEventStore((state) => state.pressedKeys);
  const mouseEnter = useWindowStore((state) => state.mouseEnter);
  const resizingCursor = useEventStore((state) => state.resizingCursor);
  // Store actions
  const setRect = useFileStore((state) => state.setSelectBoxRect);
  const unselectAllFiles = useFileStore((state) => state.unselectAllFiles);
  const setCurrentWindowKey = useFileStore(
    (state) => state.setSelectBoxWindowKey
  );
  const findWindow = useWindowStore((state) => state.findWindow);

  // States
  const [isSelecting, setIsSelecting] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [targetWindowRect, setTargetWindowRect] = useState<DOMRect | null>();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const selectStart = useCallback(
    (e: MouseEvent) => {
      // Check if the click is inside the menu
      const currentMenuRef = menuRef?.current;
      if (currentMenuRef?.contains(e.target as Node)) return;
      // Check if the click is inside the highlighted file
      if (highlightedFile) return;
      if (resizingCursor) return;
      // Check if the click is inside a window header (dragging the window)
      const target = e.target as HTMLElement;
      const headerEl = target.closest("[role='toolbar']");
      if (headerEl) return;

      // If Shift key not pressed, unselect all files
      if (!pressedKeys.includes("Shift")) {
        unselectAllFiles();
      }

      // Get target window rect and start selecting
      setCurrentWindowKey(null);

      // Determine the active window: use currentWindow if valid, otherwise
      // fall back to the background window (e.g. after closing a window)
      const activeWindow =
        currentWindow && findWindow(currentWindow.key) ? currentWindow : null;

      if (activeWindow) {
        const window = findWindow(activeWindow.key);
        // If the window is a background window
        if (
          window?.type === WindowType.Background &&
          activeWindow.windowRef.current
        ) {
          setIsSelecting(true);
          setStart({ x: e.clientX, y: e.clientY });
          document.body.style.cursor = "default";
          setTargetWindowRect(
            activeWindow.windowRef.current.getBoundingClientRect()
          );
          setCurrentWindowKey(activeWindow.key);
          // If the window is a content window
        } else if (
          activeWindow.contentRef?.current &&
          mouseEnter &&
          window &&
          getWindowConfig(window.type).supportsSelection
        ) {
          setIsSelecting(true);
          setStart({ x: e.clientX, y: e.clientY });
          document.body.style.cursor = "default";
          setTargetWindowRect(
            activeWindow.contentRef.current.getBoundingClientRect()
          );
          setCurrentWindowKey(activeWindow.key);
        }
      } else {
        // Fallback: find background workspace element directly
        const backgroundEl = containerRef.current?.querySelector(
          "[aria-label='background workspace']"
        );
        if (backgroundEl) {
          setIsSelecting(true);
          setStart({ x: e.clientX, y: e.clientY });
          document.body.style.cursor = "default";
          setTargetWindowRect(backgroundEl.getBoundingClientRect());
        }
      }
    },
    [
      menuRef,
      highlightedFile,
      resizingCursor,
      pressedKeys,
      setCurrentWindowKey,
      currentWindow,
      unselectAllFiles,
      findWindow,
      mouseEnter,
    ]
  );

  const selecting = useCallback(
    (e: MouseEvent) => {
      if (
        !containerRef.current ||
        !boxRef.current ||
        !isSelecting ||
        !targetWindowRect
      )
        return;

      const left = Math.max(
        Math.min(start.x, e.clientX),
        targetWindowRect.left
      );
      const top = Math.max(Math.min(start.y, e.clientY), targetWindowRect.top);
      const right = Math.min(
        Math.max(start.x, e.clientX),
        targetWindowRect.right
      );
      const bottom = Math.min(
        Math.max(start.y, e.clientY),
        targetWindowRect.bottom
      );
      const width = right - left;
      const height = bottom - top;

      boxRef.current.style.left = `${left}px`;
      boxRef.current.style.top = `${top}px`;
      boxRef.current.style.width = `${width}px`;
      boxRef.current.style.height = `${height}px`;
      boxRef.current.style.display = "block";

      setRect({
        ...boxRef.current.getBoundingClientRect(),
        left,
        top,
        right,
        bottom,
      });
    },
    [isSelecting, setRect, start.x, start.y, targetWindowRect]
  );

  // Selecting end event listener
  const selectingEnd = useCallback(() => {
    if (!boxRef.current) return;
    setIsSelecting(false);
    setRect(null);
    boxRef.current.style.display = "none";
  }, [setRect]);

  // Event listeners
  useEffect(() => {
    document.addEventListener("mousedown", selectStart);
    return () => {
      document.removeEventListener("mousedown", selectStart);
    };
  }, [selectStart]);

  useEffect(() => {
    document.addEventListener("mousemove", selecting);
    return () => {
      document.removeEventListener("mousemove", selecting);
    };
  }, [selecting]);

  useEffect(() => {
    document.addEventListener("mouseup", selectingEnd);
    return () => {
      document.removeEventListener("mouseup", selectingEnd);
    };
  }, [selectingEnd]);

  return (
    <div className={`full-size`} ref={containerRef}>
      <div className={styles.box} ref={boxRef} />
      {children}
    </div>
  );
}
