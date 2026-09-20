"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useCartStore } from "@/store/cart";

/**
 * Scopes the cart to the signed-in user: whenever the session's identity
 * changes (sign in, sign out, switching accounts), swaps `items` to that
 * user's own saved cart instead of leaving the previous user's items visible.
 */
export function CartSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    useCartStore.getState().setUser(session?.user?.id ?? null);
  }, [status, session?.user?.id]);

  return null;
}
