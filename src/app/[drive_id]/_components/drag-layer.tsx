"use client";

import { useEffect, useRef } from "react";
import { useMv } from "@/domain/file-mutations";
import { useFileStore, useWindowStore } from "@/infra/stores";
import { parseSerialKey } from "@/infra/stores/serial-key";
import { useDrag } from "@/interactions";
import styles from "./drag-layer.module.css";

/**
 * Pure presentational ghost for an active drag. The actual drag-and-drop
 * state machine, hit-testing, and pointer pipeline live in
 * `interactions/store.ts` + `interactions/bindings.tsx`. This component
 * only:
 *   - subscribes to the drag phase,
 *   - commits the chosen `sources` (selected files) into the store
 *     once the phase turns into `dropping`,
 *   - and renders a tracking ghost positioned at the latest pointer.
 *
 * When the drop completes, it executes the mv mutation and resets
 * the interaction store.
 */
export default function DragLayer({ children }: { children: React.ReactNode }) {
  const drag = useDrag();
  const ghostRef = useRef<HTMLDivElement>(null);
  const mv = useMv();
  const unselectAllFiles = useFileStore((s) => s.unselectAllFiles);
  const selectedFileSerials = useFileStore((s) => s.selectedFileSerials);
  const currentWindow = useWindowStore((s) => s.currentWindow);
  const findWindow = useWindowStore((s) => s.findWindow);

  useEffect(() => {
    if (drag.phase === "dragging" && drag.last && ghostRef.current) {
      ghostRef.current.style.left = `${drag.last.x}px`;
      ghostRef.current.style.top = `${drag.last.y}px`;
    }
  }, [drag.phase, drag.last]);

  useEffect(() => {
    if (drag.phase !== "dropping") return;
    const target = drag.target;
    if (!target) return;
    const driveID = findWindow(currentWindow?.key || "")?.driveID || "";
    if (!driveID) return;
    const sources = selectedFileSerials
      .map((s) => parseSerialKey(s).fileKey)
      .filter((p) => p !== target);

    if (sources.length === 0) {
      unselectAllFiles();
      return;
    }

    mv.run({ driveID, data: { sources, destination: target } }).finally(() =>
      unselectAllFiles()
    );
  }, [
    drag.phase,
    drag.target,
    selectedFileSerials,
    currentWindow,
    findWindow,
    mv,
    unselectAllFiles,
  ]);

  const isDragging = drag.phase === "dragging";

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
          <div className={styles.dragging_file_count}>
            {selectedFileSerials.length}
          </div>
        ) : null}
      </div>
    </>
  );
}
