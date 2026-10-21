import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompareState = {
  ids: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : state.ids.length >= 4
              ? state.ids
              : [...state.ids, productId],
        })),
      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
        })),
      clear: () => set({ ids: [] }),
      has: (productId) => get().ids.includes(productId),
    }),
    { name: "agas-compare" },
  ),
);
