"use client";

import { useTranslations } from "@/lib/i18n";

export function ContactContent() {
  const t = useTranslations().contact;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink sm:text-3xl">
        {t.title}
      </h1>
      <div className="mt-6 space-y-2 text-sm leading-relaxed text-ink/70">
        <p>{t.intro}</p>
        <p>
          {t.emailLabel}:{" "}
          <a href="mailto:support@offgrid.dev" className="text-ink underline underline-offset-4">
            support@offgrid.dev
          </a>
        </p>
      </div>
    </div>
  );
}
