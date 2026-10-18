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

/** Key used for `carts` when nobody is signed in. */
const GUEST_KEY = "guest";

type CartState = {
  items: CartLine[];
  /** Other identities' saved carts, keyed by userId (or `GUEST_KEY`) — everyone but `activeUserKey`. */
  carts: Record<string, CartLine[]>;
  /** Whose cart `items` currently represents. */
  activeUserKey: string;
  isOpen: boolean;
  addItem: (input: AddInput) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Call on sign-in/sign-out so `items` always reflects the signed-in user's own cart. */
  setUser: (userId: string | null) => void;
};

/** Most units of one line a cart can hold — the same cap `/api/checkout` enforces per line. */
export const MAX_LINE_QUANTITY = 20;

const clampQuantity = (quantity: number) => Math.min(MAX_LINE_QUANTITY, quantity);

const lineId = (slug: string, size?: string, color?: string) =>
  [slug, size ?? "-", color ?? "-"].join("::");

/** `base` with `extra` added on top — matching lines add up their quantities. */
function mergeLines(base: CartLine[], extra: CartLine[]): CartLine[] {
  const merged = [...base];
  for (const line of extra) {
    const index = merged.findIndex((existing) => existing.id === line.id);
    if (index === -1) merged.push(line);
    else merged[index] = { ...merged[index], quantity: clampQuantity(merged[index].quantity + line.quantity) };
  }
  return merged;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      carts: {},
      activeUserKey: GUEST_KEY,
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
                  ? { ...line, quantity: clampQuantity(line.quantity + qty) }
                  : line,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...input, id, quantity: clampQuantity(qty) }],
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
              line.id === id ? { ...line, quantity: clampQuantity(quantity) } : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setUser: (userId) =>
        set((state) => {
          const nextKey = userId ?? GUEST_KEY;
          if (nextKey === state.activeUserKey) return {};
          // Stash the outgoing identity's items and swap in the incoming
          // identity's saved cart (empty for a first-time visitor) — this
          // is what keeps signing out / switching accounts from leaking
          // one user's cart into another's.
          const carts = { ...state.carts, [state.activeUserKey]: state.items };
          let items = carts[nextKey] ?? [];
          // Signing in takes the guest's cart along: checkout sends guests to
          // the sign-in page, and they must find their cart there afterwards.
          if (state.activeUserKey === GUEST_KEY && userId) {
            items = mergeLines(items, state.items);
            carts[GUEST_KEY] = [];
          }
          return {
            carts,
            activeUserKey: nextKey,
            items,
            isOpen: false,
          };
        }),
    }),
    {
      name: "offgrid-cart",
      // Drawer visibility is a transient UI concern — never persist or
      // rehydrate it, otherwise a page refresh could reopen the drawer.
      partialize: (state) => ({
        items: state.items,
        carts: state.carts,
        activeUserKey: state.activeUserKey,
      }),
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
