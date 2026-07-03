"use client";

import { selectBoxRect, useSelectBox } from "@/interact";
import styles from "./select-box-layer.module.css";

export default function SelectBoxLayer({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useSelectBox();
  const rect = selectBoxRect(state);
  return (
    <>
      {children}
      <div
        className={styles.box}
        style={{
          display: rect ? "block" : "none",
          left: rect?.x ?? 0,
          top: rect?.y ?? 0,
          width: rect?.w ?? 0,
          height: rect?.h ?? 0,
        }}
      />
    </>
  );
}
