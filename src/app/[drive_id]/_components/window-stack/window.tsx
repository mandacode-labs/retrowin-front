import { memo, useCallback, useEffect, useRef, useState } from "react";
import { getWindowConfig } from "@/config/window";
import { useWindowStore } from "@/core/stores";
import { WindowType } from "@/entities/window";
import { useWindowAffordance } from "@/runtime/adapters/use-window-affordance";
import styles from "./window.module.css";
import WindowContent from "./window-content-router";
import WindowHeader from "./window-header";

const MIN_SIZE = { width: 250, height: 180 };

export default memo(function Window({ windowKey }: { windowKey: string }) {
  const targetWindow = useWindowStore((s) =>
    s.windows.find((w) => w.key === windowKey)
  );
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const highlightWindow = useWindowStore((s) => s.highlightWindow);
  const prevWindow = useWindowStore((s) => s.prevWindow);
  const nextWindow = useWindowStore((s) => s.nextWindow);
  const setCurrentWindow = useWindowStore((s) => s.setCurrentWindow);
  const setMouseEnter = useWindowStore((s) => s.setMouseEnter);
  const setTitle = useWindowStore((s) => s.setTitle);
  const hasPrevWindow = useWindowStore((s) => s.hasPrevWindow);
  const hasNextWindow = useWindowStore((s) => s.hasNextWindow);

  const windowRef = useRef<HTMLDivElement>(null);
  const windowContentRef = useRef<HTMLDivElement>(null);
  const positionInitializedRef = useRef(false);

  const [maximized, setMaximized] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [prevSize, setPrevSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [prevPosition, setPrevPosition] = useState({ x: 0, y: 0 });
  const [contentLoading, setContentLoading] = useState(false);

  const wa = useWindowAffordance();

  useEffect(() => {
    if (!targetWindow) return;
    if (targetWindow.type === WindowType.Uploader) {
      setTitle(windowKey, "Uploader");
    } else if (targetWindow.targetKey) {
      const segments = targetWindow.targetKey.split("/").filter(Boolean);
      setTitle(windowKey, segments.pop() || targetWindow.targetKey);
    }
  }, [setTitle, windowKey, targetWindow]);

  // Initial placement: center the window on the viewport the first time
  // we render for a given target window.
  useEffect(() => {
    if (windowRef.current && targetWindow && !positionInitializedRef.current) {
      const config = getWindowConfig(targetWindow.type);
      const x = document.body.clientWidth / 2 - config.defaultSize.width / 2;
      const y = document.body.clientHeight / 2 - config.defaultSize.height / 2;
      setPosition({ x, y });
      setSize(config.defaultSize);
      positionInitializedRef.current = true;
    }
  });

  // Drive inline style from local state, unless the affordance FSM is
  // actively dragging this window — then we render the live preview.
  useEffect(() => {
    const node = windowRef.current;
    if (!node) return;
    const active =
      wa.phase === "active" &&
      wa.iid === windowKey &&
      wa.kind === "move" &&
      wa.start !== null &&
      wa.last !== null;
    if (active && wa.start && wa.last) {
      const dx = wa.last.x - wa.start.x;
      const dy = wa.last.y - wa.start.y;
      node.style.left = `${position.x + dx}px`;
      node.style.top = `${position.y + dy}px`;
      node.style.width = `${size.width}px`;
      node.style.height = `${size.height}px`;
    } else {
      node.style.width = `${size.width}px`;
      node.style.height = `${size.height}px`;
      node.style.left = `${position.x}px`;
      node.style.top = `${position.y}px`;
    }
  }, [wa, windowKey, position, size]);

  // When the FSM transitions into ended (and not cancelled) for this
  // window, commit the visible preview to local state.
  const committedWaRef = useRef(wa.phase);
  useEffect(() => {
    if (
      wa.phase === "ended" &&
      committedWaRef.current === "active" &&
      !wa.cancelled
    ) {
      if (wa.kind === "move" && wa.start && wa.last && wa.iid === windowKey) {
        const dx = wa.last.x - wa.start.x;
        const dy = wa.last.y - wa.start.y;
        const next = clampPosition(
          {
            x: position.x + dx,
            y: position.y + dy,
          },
          size
        );
        setPosition(next);
      } else if (
        wa.kind === "resize" &&
        wa.start &&
        wa.last &&
        wa.iid === windowKey
      ) {
        const node = windowRef.current;
        if (node) {
          const rect = node.getBoundingClientRect();
          const width = Math.max(wa.last.x - rect.left, MIN_SIZE.width);
          const height = Math.max(wa.last.y - rect.top, MIN_SIZE.height);
          setSize({ width, height });
        }
      }
    }
    committedWaRef.current = wa.phase;
  }, [wa, windowKey, position, size]);

  const maximizeWindow = useCallback(() => {
    setPrevSize(size);
    setPrevPosition(position);
    setSize({
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    });
    setPosition({ x: 0, y: 0 });
    setMaximized(true);
  }, [position, size]);

  const revertWindowSize = useCallback(() => {
    setSize(prevSize);
    setPosition(prevPosition);
    setMaximized(false);
  }, [prevSize, prevPosition]);

  const enterWindow = useCallback(() => {
    setCurrentWindow({
      key: windowKey,
      windowRef,
      contentRef: windowContentRef,
      headerRef: null,
    });
  }, [setCurrentWindow, windowKey]);

  if (targetWindow?.minimized) return null;
  if (!targetWindow) return null;

  return (
    <article
      className={`flex-center ${styles.container}`}
      ref={windowRef}
      onMouseDown={() => highlightWindow(windowKey)}
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
    >
      <WindowHeader
        loading={contentLoading}
        title={targetWindow.title || ""}
        prevWindowAction={() => prevWindow(windowKey)}
        nextWindowAction={() => nextWindow(windowKey)}
        hasPrevWindow={hasPrevWindow(windowKey)}
        hasNextWindow={hasNextWindow(windowKey)}
        buttonActions={[
          { action: () => minimizeWindow(windowKey), icon: "minimize" },
          {
            action: maximized ? revertWindowSize : maximizeWindow,
            icon: maximized ? "exit_fullscreen" : "fullscreen",
          },
          { action: () => closeWindow(windowKey), icon: "close" },
        ]}
        onMouseEnter={() => setCurrentWindow(null)}
        windowKey={windowKey}
        affordance="move"
      />
      <WindowContent
        fileKey={targetWindow.targetKey}
        fileName={targetWindow.targetKey.split("/").filter(Boolean).pop() || ""}
        windowKey={windowKey}
        setLoading={setContentLoading}
        type={targetWindow.type}
        ref={windowContentRef}
        onMouseEnter={enterWindow}
      />
      <div
        aria-hidden="true"
        data-iid={windowKey}
        data-zone="window-affordance"
        data-affordance="resize"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 14,
          height: 14,
          cursor: "nwse-resize",
          background: "transparent",
        }}
      />
    </article>
  );
});

function clampPosition(
  next: { x: number; y: number },
  size: { width: number; height: number }
): { x: number; y: number } {
  if (typeof document === "undefined") return next;
  const maxX = Math.max(0, document.body.clientWidth - size.width);
  const maxY = Math.max(0, document.body.clientHeight - size.height);
  return {
    x: Math.min(Math.max(0, next.x), maxX),
    y: Math.min(Math.max(0, next.y), maxY),
  };
}
