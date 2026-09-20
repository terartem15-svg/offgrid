"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

import { useBrandOptions, useMenuMedia } from "@/components/layout/menu-data";
import { MenuLeafLinks } from "@/components/layout/menu-leaf-links";
import { MenuPhotoGrid } from "@/components/layout/menu-photo-grid";
import { useNavClickHandlers } from "@/components/layout/nav-click-handlers";
import { useTranslations } from "@/lib/i18n";
import {
  MEGA_MENU_GENDERS,
  MEGA_MENU_SECTIONS,
  megaMenuSectionHref,
  type MegaMenuGender,
} from "@/lib/mega-menu";
import { cn } from "@/lib/utils";

const ROW_CLASS =
  "flex w-full items-center justify-between px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink";

/**
 * Burger + slide-in drawer for screens below `lg`, where the header's inline
 * nav is hidden. Mirrors the desktop mega menu: gender → section → photos and
 * links, with the same data and the same photo cards.
 */
export function MobileMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const { onHomeClick, onContactClick } = useNavClickHandlers();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [gender, setGender] = useState<MegaMenuGender>("men");
  const [sectionKey, setSectionKey] = useState<string | null>(null);

  const brands = useBrandOptions(open && shopOpen);
  const media = useMenuMedia(gender, open && shopOpen);

  const close = () => setOpen(false);

  // The portal target only exists on the client.
  useEffect(() => setMounted(true), []);

  // Close after any navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={t.nav.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portalled to <body>: the header's backdrop-blur would otherwise make it the containing block of this `fixed` layer. */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div onClick={close} className="absolute inset-0 animate-in bg-ink/40 duration-300 fade-in" />

            <aside
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.menu}
              className="absolute left-0 top-0 flex h-full w-full max-w-sm animate-in flex-col bg-white shadow-xl duration-300 slide-in-from-left"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink/10 px-4">
                <Link
                  href="/"
                  onClick={(e) => {
                    close();
                    onHomeClick(e);
                  }}
                  className="text-xl font-bold uppercase tracking-[0.24em] text-ink"
                >
                  OFFGRID
                </Link>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.nav.closeMenu}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-ink/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 divide-y divide-ink/10 overflow-y-auto overscroll-contain">
                <Link
                  href="/"
                  onClick={(e) => {
                    close();
                    onHomeClick(e);
                  }}
                  className={ROW_CLASS}
                >
                  {t.nav.home}
                </Link>

                <div>
                  <button
                    type="button"
                    aria-expanded={shopOpen}
                    onClick={() => setShopOpen((v) => !v)}
                    className={ROW_CLASS}
                  >
                    {t.nav.shop}
                    <ChevronDown className={cn("h-4 w-4 transition-transform", shopOpen && "rotate-180")} />
                  </button>

                  {shopOpen && (
                    <div className="bg-paper px-5 pb-3 pt-4">
                      <div className="flex gap-1 rounded-md bg-ink/[0.06] p-1">
                        {MEGA_MENU_GENDERS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            aria-pressed={gender === g}
                            onClick={() => setGender(g)}
                            className={cn(
                              "flex-1 rounded px-2 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
                              gender === g ? "bg-white text-ink shadow-sm" : "text-ink/60",
                            )}
                          >
                            {t.megaMenu.genders[g]}
                          </button>
                        ))}
                      </div>

                      <ul className="mt-2 divide-y divide-ink/10">
                        {MEGA_MENU_SECTIONS.map((section) => {
                          const expanded = sectionKey === section.key;

                          return (
                            <li key={section.key}>
                              <button
                                type="button"
                                aria-expanded={expanded}
                                onClick={() => setSectionKey(expanded ? null : section.key)}
                                className={cn(
                                  "flex w-full items-center justify-between py-3.5 text-xs font-semibold uppercase tracking-[0.1em]",
                                  section.key === "sale" ? "text-red-600" : "text-ink",
                                )}
                              >
                                {t.megaMenu.sections[section.key]}
                                <ChevronDown
                                  className={cn("h-4 w-4 opacity-50 transition-transform", expanded && "rotate-180")}
                                />
                              </button>

                              {expanded && (
                                <div className="pb-4">
                                  <MenuPhotoGrid
                                    key={`${gender}-${section.key}`}
                                    gender={gender}
                                    section={section}
                                    media={media}
                                    onNavigate={close}
                                  />
                                  {section.kind === "link" ? (
                                    <Link
                                      href={megaMenuSectionHref(gender, section.key)}
                                      onClick={close}
                                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink"
                                    >
                                      {t.megaMenu.viewAll}
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                  ) : (
                                    <MenuLeafLinks
                                      gender={gender}
                                      section={section}
                                      brands={brands}
                                      onNavigate={close}
                                      className="mt-3"
                                    />
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <Link href="/#collections" onClick={close} className={ROW_CLASS}>
                  {t.nav.collections}
                </Link>
                <Link href="/about" onClick={close} className={ROW_CLASS}>
                  {t.nav.aboutUs}
                </Link>
                <Link
                  href="/contact"
                  onClick={(e) => {
                    close();
                    onContactClick(e);
                  }}
                  className={ROW_CLASS}
                >
                  {t.nav.contact}
                </Link>
                <Link href="/account" onClick={close} className={ROW_CLASS}>
                  {t.account.myAccount}
                </Link>
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
