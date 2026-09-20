"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

import { useBrandOptions, useMenuMedia } from "@/components/layout/menu-data";
import { MenuLeafLinks } from "@/components/layout/menu-leaf-links";
import { MenuPhotoGrid } from "@/components/layout/menu-photo-grid";
import { useTranslations } from "@/lib/i18n";
import {
  MEGA_MENU_GENDERS,
  MEGA_MENU_SECTIONS,
  megaMenuSectionHref,
  type MegaMenuGender,
} from "@/lib/mega-menu";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 150;

export function MegaMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<MegaMenuGender>("men");
  const [sectionKey, setSectionKey] = useState<string>("clothing");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Both are fetched lazily on first hover — the trigger link stays free of
  // network requests until the menu actually opens.
  const brands = useBrandOptions(open);
  const media = useMenuMedia(gender, open);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    cancelClose();
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const close = () => setOpen(false);

  const activeSection = MEGA_MENU_SECTIONS.find((section) => section.key === sectionKey);

  return (
    // Stretches to the full header height so the pointer can travel from the
    // link straight down into the panel without ever leaving the menu.
    <div className="flex items-center self-stretch" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href="/catalog"
        aria-haspopup="true"
        aria-expanded={open}
        className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
      >
        {t.nav.shop}
      </Link>

      {open && (
        // Anchored to the header rather than the link, so the wide panel is
        // centred on the page and can't spill off-screen. The strip ignores
        // the pointer; only the card itself counts as "inside" the menu.
        <div className="pointer-events-none absolute inset-x-0 top-full z-50 px-4">
          <div className="pointer-events-auto mx-auto max-w-5xl animate-fade-in overflow-hidden rounded-b-lg border-x border-b border-ink/10 bg-white shadow-xl">
            <div className="flex min-h-[27rem] divide-x divide-ink/10">
              {/* Level 1 — gender */}
              <div className="w-36 shrink-0 py-4">
                {MEGA_MENU_GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onMouseEnter={() => setGender(g)}
                    className={cn(
                      "block w-full px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] transition-colors",
                      gender === g ? "bg-paper text-ink" : "text-ink/60 hover:bg-paper hover:text-ink",
                    )}
                  >
                    {t.megaMenu.genders[g]}
                  </button>
                ))}
              </div>

              {/* Level 2 — sections */}
              <div className="w-48 shrink-0 py-4">
                {MEGA_MENU_SECTIONS.map((section) => {
                  if (section.kind === "link") {
                    return (
                      <Link
                        key={section.key}
                        href={megaMenuSectionHref(gender, section.key)}
                        onMouseEnter={() => setSectionKey(section.key)}
                        onClick={close}
                        className={cn(
                          "block px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-paper",
                          section.key === "sale" ? "text-red-600 hover:text-red-700" : "text-ink/60 hover:text-ink",
                        )}
                      >
                        {t.megaMenu.sections[section.key]}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onMouseEnter={() => setSectionKey(section.key)}
                      className={cn(
                        "flex w-full items-center justify-between px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.1em] transition-colors",
                        sectionKey === section.key
                          ? "bg-paper text-ink"
                          : "text-ink/60 hover:bg-paper hover:text-ink",
                      )}
                    >
                      {t.megaMenu.sections[section.key]}
                      <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    </button>
                  );
                })}
              </div>

              {activeSection && (
                <>
                  {/* Level 3 — leaf subcategories or brands */}
                  <div className="w-72 shrink-0 px-5 py-4">
                    {activeSection.kind === "link" ? (
                      <Link
                        href={megaMenuSectionHref(gender, activeSection.key)}
                        onClick={close}
                        className="inline-flex items-center gap-1.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink hover:underline"
                      >
                        {t.megaMenu.viewAll}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <MenuLeafLinks gender={gender} section={activeSection} brands={brands} onNavigate={close} />
                    )}
                  </div>

                  {/* Level 4 — photos; re-keyed so the cards fade in again on every switch */}
                  <div className="min-w-0 flex-1 p-5">
                    <MenuPhotoGrid
                      key={`${gender}-${activeSection.key}`}
                      gender={gender}
                      section={activeSection}
                      media={media}
                      onNavigate={close}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
