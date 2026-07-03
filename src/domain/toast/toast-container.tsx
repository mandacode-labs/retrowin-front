"use client";

import { useToastStore } from "@/domain/toast/store";
import styles from "./toast-container.module.css";

export function ToastContainer() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  if (items.length === 0) return null;
  return (
    <div className={styles.container} role="status" aria-live="polite">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.toast} ${styles[t.kind]}`}
          onClick={() => dismiss(t.id)}
        >
          <span className={styles.message}>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
