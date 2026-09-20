"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
};

/** Key used for `lists` when nobody is signed in. */
const GUEST_KEY = "guest";

type WishlistState = {
  items: WishlistItem[];
  /** Other identities' saved wishlists, keyed by userId (or `GUEST_KEY`) — everyone but `activeUserKey`. */
  lists: Record<string, WishlistItem[]>;
  /** Whose wishlist `items` currently represents. */
  activeUserKey: string;
  isOpen: boolean;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (slug: string) => void;
  open: () => void;
  close: () => void;
  /** Call on sign-in/sign-out so `items` always reflects the signed-in user's own wishlist. */
  setUser: (userId: string | null) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      lists: {},
      activeUserKey: GUEST_KEY,
      isOpen: false,
      toggleItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.slug === item.slug);
          return {
            items: exists
              ? state.items.filter((i) => i.slug !== item.slug)
              : [...state.items, item],
          };
        }),
      removeItem: (slug) =>
        set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setUser: (userId) =>
        set((state) => {
          const nextKey = userId ?? GUEST_KEY;
          if (nextKey === state.activeUserKey) return {};
          // Same swap-on-identity-change trick as the cart store — stash the
          // outgoing identity's items and swap in the incoming identity's
          // saved wishlist, so signing out never leaks one user's list into another's.
          const lists = { ...state.lists, [state.activeUserKey]: state.items };
          return {
            lists,
            activeUserKey: nextKey,
            items: lists[nextKey] ?? [],
            isOpen: false,
          };
        }),
    }),
    {
      name: "offgrid-wishlist",
      // Drawer visibility is a transient UI concern — never persist or
      // rehydrate it, otherwise a page refresh could reopen the drawer.
      partialize: (state) => ({
        items: state.items,
        lists: state.lists,
        activeUserKey: state.activeUserKey,
      }),
    },
  ),
);

/** Number of saved items. */
export const selectWishlistCount = (state: WishlistState) => state.items.length;
