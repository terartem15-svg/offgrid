"use client";

import { useTranslations } from "@/lib/i18n";

export function AboutContent() {
  const t = useTranslations().about;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink sm:text-3xl">
        {t.title}
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/70">
        <p>{t.p1}</p>
        <p>{t.p2}</p>
      </div>
    </div>
  );
}
