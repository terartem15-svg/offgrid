"use client";

import { features } from "@/data/mock";
import { useTranslations } from "@/lib/i18n";

export function FeaturesBar() {
  const t = useTranslations().features;

  return (
    <section className="border-b border-ink/10 bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
        {features.map(({ id, icon: Icon }) => (
          <div key={id} className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ink/15 bg-white">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {t[id].title}
              </p>
              <p className="text-xs text-ink/55">{t[id].text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
