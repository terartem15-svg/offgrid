"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Search, User } from "lucide-react";

import { CartIndicator } from "@/components/layout/cart-indicator";
import { MegaMenu } from "@/components/layout/mega-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useNavClickHandlers } from "@/components/layout/nav-click-handlers";
import { RegionSwitcher } from "@/components/layout/region-switcher";
import { SearchModal } from "@/components/layout/search-modal";
import { WishlistIndicator } from "@/components/layout/wishlist-indicator";
import { useTranslations } from "@/lib/i18n";

const NAV_LINK_CLASS =
  "text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink";

const NAV_HREFS = [
  { key: "home", href: "/" },
  { key: "collections", href: "/#collections" },
  { key: "aboutUs", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  // Stable, because SearchModal resets its query whenever `onClose` changes identity.
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const t = useTranslations();
  const { onHomeClick, onContactClick } = useNavClickHandlers();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <MobileMenu />
          <Link
            href="/"
            onClick={onHomeClick}
            className="text-lg font-bold uppercase tracking-[0.18em] text-ink sm:text-xl sm:tracking-[0.24em]"
          >
            OFFGRID
          </Link>
        </div>

        <nav className="hidden h-full items-center gap-8 lg:flex">
          <Link
            href={NAV_HREFS[0].href}
            onClick={onHomeClick}
            className={NAV_LINK_CLASS}
          >
            {t.nav.home}
          </Link>

          <MegaMenu />

          {NAV_HREFS.slice(1).map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={link.key === "contact" ? onContactClick : undefined}
              className={NAV_LINK_CLASS}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <RegionSwitcher />
          <button
            type="button"
            aria-label={t.nav.search}
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/account"
            aria-label={t.nav.account}
            // Below sm the drawer carries this link instead, to keep the header from overflowing.
            className="hidden h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5 sm:inline-flex"
          >
            <User className="h-5 w-5" />
          </Link>
          <WishlistIndicator />
          <CartIndicator />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
