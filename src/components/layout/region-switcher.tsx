"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { FlagIcon } from "@/components/shared/flag-icon";
import { useTranslations } from "@/lib/i18n";
import { DEFAULT_REGION_CODE, REGIONS, regionByCode, useRegionStore } from "@/store/region";

type Tab = "language" | "region";

export function RegionSwitcher() {
  const code = useRegionStore((s) => s.code);
  const setCode = useRegionStore((s) => s.setCode);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("language");

  // Avoid a hydration mismatch: the persisted region is only known on the client.
  useEffect(() => setMounted(true), []);

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

  const region = regionByCode(mounted ? code : DEFAULT_REGION_CODE);
  const t = useTranslations().regionSwitcher;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.trigger}
        className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:bg-ink/5"
      >
        <FlagIcon code={region.code} />
        {/* Dropped on phones to keep the header from overflowing next to the burger. */}
        <span className="hidden sm:inline">{region.code}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.trigger}
            className="absolute inset-x-0 top-0 mx-auto w-full max-w-sm overflow-hidden rounded-b-lg bg-white shadow-xl sm:top-16 sm:rounded-lg"
          >
            <div className="flex items-stretch justify-between border-b border-ink/10">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setTab("language")}
                  className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    tab === "language" ? "text-ink" : "text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {t.language}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("region")}
                  className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    tab === "region" ? "text-ink" : "text-ink/40 hover:text-ink/70"
                  }`}
                >
                  {t.region}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="m-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-ink/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">
              {tab === "language" ? t.selectLanguage : t.selectRegion}
            </p>

            <ul className="py-2">
              {REGIONS.map((r) => {
                const selected = r.code === region.code;
                return (
                  <li key={r.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(r.code);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-paper"
                    >
                      <span className="flex items-center gap-3">
                        <FlagIcon code={r.code} />
                        <span className={selected ? "font-semibold text-ink" : "text-ink/70"}>
                          {tab === "language" ? r.language : r.country}
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 text-ink" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
