"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, User } from "lucide-react";

import { CartIndicator } from "@/components/layout/cart-indicator";
import { SearchModal } from "@/components/layout/search-modal";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/catalog" },
  { label: "Collections", href: "/catalog" },
  { label: "About Us", href: "/" },
  { label: "Contact", href: "/" },
];

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold uppercase tracking-[0.24em] text-ink"
        >
          OFFGRID
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/account"
            aria-label="Account"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <User className="h-5 w-5" />
          </Link>
          <CartIndicator />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
