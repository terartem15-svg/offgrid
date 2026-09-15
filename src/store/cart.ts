"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  /** Stable key: slug + size + color */
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
};

type AddInput = Omit<CartLine, "id" | "quantity"> & { quantity?: number };

type CartState = {
  items: CartLine[];
  isOpen: boolean;
  addItem: (input: AddInput) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const lineId = (slug: string, size?: string, color?: string) =>
  [slug, size ?? "-", color ?? "-"].join("::");

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (input) =>
        set((state) => {
          const id = lineId(input.slug, input.size, input.color);
          const qty = input.quantity ?? 1;
          const existing = state.items.find((line) => line.id === id);
          if (existing) {
            return {
              items: state.items.map((line) =>
                line.id === id
                  ? { ...line, quantity: line.quantity + qty }
                  : line,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...input, id, quantity: qty }],
            isOpen: true,
          };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((line) => line.id !== id),
        })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              line.id === id ? { ...line, quantity } : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "offgrid-cart",
      // Drawer visibility is a transient UI concern — never persist or
      // rehydrate it, otherwise a page refresh could reopen the drawer.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Total number of units in the cart. */
export const selectCartCount = (state: CartState) =>
  state.items.reduce((total, line) => total + line.quantity, 0);

/** Cart subtotal in EUR. */
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((total, line) => total + line.price * line.quantity, 0);

/** Order subtotal (EUR) above which shipping is free. */
export const FREE_SHIPPING_THRESHOLD = 150;
