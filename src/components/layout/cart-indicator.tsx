"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

import { selectCartCount, useCartStore } from "@/store/cart";

export function CartIndicator() {
  const count = useCartStore(selectCartCount);
  const open = useCartStore((s) => s.open);
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration mismatch: the persisted count is only known on the client.
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart${mounted && count > 0 ? `, ${count} items` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5"
    >
      <ShoppingBag className="h-5 w-5" />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
