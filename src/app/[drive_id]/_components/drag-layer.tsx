"use client";

import { useEffect, useRef } from "react";
import { useFileStore } from "@/core/stores";
import { useDrag, useIsDragging } from "@/runtime";
import styles from "./drag-layer.module.css";

/**
 * Pure presentational ghost for an active drag. The pointer runtime
 * (`runtime/runtime.tsx`) commits the mv mutation in its own rAF
 * tick when the drag machine enters the `dropping` phase, so this
 * component has zero `useEffect` for commit, no lock refs, and no
 * useState. It only paints the ghost at the latest pointer location.
 */
export default function DragLayer({ children }: { children: React.ReactNode }) {
  const drag = useDrag();
  const isDragging = useIsDragging();
  const ghostRef = useRef<HTMLDivElement>(null);
  const selectedCount = useFileStore((s) => s.selectedFileSerials.length);

  useEffect(() => {
    if (drag.phase === "dragging" && drag.last && ghostRef.current) {
      ghostRef.current.style.left = `${drag.last.x}px`;
      ghostRef.current.style.top = `${drag.last.y}px`;
    }
  }, [drag.phase, drag.last]);

  return (
    <>
      {children}
      <div
        ref={ghostRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          pointerEvents: "none",
          display: isDragging ? "block" : "none",
          zIndex: 1000,
        }}
        className={styles.dragging_files}
      >
        {isDragging ? (
          <div className={styles.dragging_file_count}>{selectedCount}</div>
        ) : null}
      </div>
    </>
  );
}
