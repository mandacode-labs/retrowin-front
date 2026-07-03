import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  createdAt: number;
};

export type ToastAction = {
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const AUTO_DISMISS_MS = 5_000;

export const useToastStore = create<
  {
    items: Toast[];
    timers: Map<string, ReturnType<typeof setTimeout>>;
  } & ToastAction
>((set, get) => ({
  items: [],
  timers: new Map(),
  push: (kind, message) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    set((s) => ({
      items: [...s.items, { id, kind, message, createdAt: now }],
    }));
    const handle = setTimeout(() => {
      get().dismiss(id);
    }, AUTO_DISMISS_MS);
    get().timers.set(id, handle);
  },
  dismiss: (id) => {
    const handle = get().timers.get(id);
    if (handle) {
      clearTimeout(handle);
      get().timers.delete(id);
    }
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
  },
  clear: () => {
    for (const handle of get().timers.values()) clearTimeout(handle);
    get().timers.clear();
    set({ items: [] });
  },
}));

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    info: (m: string) => push("info", m),
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
  };
}
