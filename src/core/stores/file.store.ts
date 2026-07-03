import { create } from "zustand";
import { createSerialKey, parseSerialKey } from "@/core/stores/serial-key";
import type { FileType } from "@/entities/file";

export type State = {
  selectedFileSerials: string[];
  renamingFileSerial: string | null;
  highlightedFile: {
    fileKey: string;
    windowKey: string;
    fileName: string;
    type: FileType;
    ref: React.RefObject<HTMLElement | null>;
  } | null;
  fileRefs: Map<string, React.RefObject<HTMLElement | null>>;
  fileIconRefs: Map<string, React.RefObject<HTMLElement | null>>;
  // Merged from menu.store
  menuRef: React.RefObject<HTMLElement | null> | null;
  // Merged from select_box.store
  selectBoxRect: DOMRect | null;
  selectBoxWindowKey: string | null;
};

export type Action = {
  selectFile: (fileKey: string, windowKey: string) => void;
  unselectFile: (fileKey: string, windowKey: string) => void;
  unselectAllFiles: () => void;
  isFileKeySelected: (fileKey: string) => boolean;
  setRenamingFile: (
    file: { fileKey: string; windowKey: string } | null
  ) => void;
  getRenamingFile: () => { fileKey: string; windowKey: string } | null;
  setHighlightedFile: (highlightedFile: State["highlightedFile"]) => void;
  setFileIconRef: (
    fileKey: string,
    windowKey: string,
    ref: React.RefObject<HTMLElement | null>
  ) => void;
  getSelectedFileKeys: () => string[];
  // Merged from menu.store
  setMenuRef: (ref: React.RefObject<HTMLElement | null>) => void;
  // Merged from select_box.store
  setSelectBoxRect: (rect: DOMRect | null) => void;
  setSelectBoxWindowKey: (key: string | null) => void;
};

const initialState: State = {
  selectedFileSerials: [],
  renamingFileSerial: null,
  highlightedFile: null,
  fileRefs: new Map(),
  fileIconRefs: new Map(),
  menuRef: null,
  selectBoxRect: null,
  selectBoxWindowKey: null,
};

export const useFileStore = create<State & Action>((set, get) => ({
  selectedFileSerials: initialState.selectedFileSerials,
  renamingFileSerial: initialState.renamingFileSerial,
  highlightedFile: initialState.highlightedFile,
  fileRefs: initialState.fileRefs,
  fileIconRefs: initialState.fileIconRefs,
  menuRef: initialState.menuRef,
  selectBoxRect: initialState.selectBoxRect,
  selectBoxWindowKey: initialState.selectBoxWindowKey,
  selectFile: (fileKey, windowKey) => {
    set((state) => {
      const serialKey = createSerialKey(fileKey, windowKey);
      if (!state.selectedFileSerials.includes(serialKey)) {
        state.selectedFileSerials = [...state.selectedFileSerials, serialKey];
      }
      return { selectedFileSerials: state.selectedFileSerials };
    });
  },
  unselectFile: (fileKey, windowKey) => {
    const serialKey = createSerialKey(fileKey, windowKey);
    set((state) => {
      state.selectedFileSerials = state.selectedFileSerials.filter(
        (k) => k !== serialKey
      );
      return { selectedFileSerials: state.selectedFileSerials };
    });
  },
  unselectAllFiles: () => {
    set({ selectedFileSerials: [] });
  },
  isFileKeySelected: (fileKey) => {
    return get().selectedFileSerials.some((key) => key.startsWith(fileKey));
  },
  setRenamingFile: (file: { fileKey: string; windowKey: string } | null) => {
    if (file) {
      const serialKey = createSerialKey(file.fileKey, file.windowKey);
      set({ renamingFileSerial: serialKey });
    } else {
      set({ renamingFileSerial: null });
    }
  },
  getRenamingFile: () => {
    const { renamingFileSerial } = get();
    if (!renamingFileSerial) return null;
    return parseSerialKey(renamingFileSerial);
  },
  setHighlightedFile: (highlightedFile) => {
    set({ highlightedFile });
  },
  setFileIconRef: (fileKey, windowKey, ref) => {
    const serialKey = createSerialKey(fileKey, windowKey);
    set((state) => {
      state.fileIconRefs.set(serialKey, ref);
      return { fileIconRefs: state.fileIconRefs };
    });
  },
  getSelectedFileKeys: () => {
    // delete duplicated file keys
    const fileKeys = new Set<string>();
    get().selectedFileSerials.forEach((serial) => {
      const { fileKey } = parseSerialKey(serial);
      fileKeys.add(fileKey);
    });
    return Array.from(fileKeys);
  },

  // Merged from menu.store
  setMenuRef: (ref) => {
    set({ menuRef: ref });
  },

  // Merged from select_box.store
  setSelectBoxRect: (rect) => {
    set({ selectBoxRect: rect });
  },
  setSelectBoxWindowKey: (key) => {
    set({ selectBoxWindowKey: key });
  },
}));
