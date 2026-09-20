"use client";

import { useTranslations } from "@/lib/i18n";

export function NotificationBar() {
  const t = useTranslations();

  return (
    <div className="bg-ink text-white">
      <p className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
        {t.notificationBar}
      </p>
    </div>
  );
}
