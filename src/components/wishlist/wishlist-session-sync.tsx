"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useWishlistStore } from "@/store/wishlist";

/**
 * Scopes the wishlist to the signed-in user: whenever the session's identity
 * changes (sign in, sign out, switching accounts), swaps `items` to that
 * user's own saved wishlist instead of leaving the previous user's items visible.
 */
export function WishlistSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    useWishlistStore.getState().setUser(session?.user?.id ?? null);
  }, [status, session?.user?.id]);

  return null;
}
