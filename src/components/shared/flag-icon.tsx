import { Globe } from "lucide-react";

import type { Region } from "@/store/region";

/**
 * Emoji flags (🇲🇩 🇷🇺) render as plain "MD"/"RU" text on Windows Chrome/Edge —
 * those browsers don't ship a color-emoji font for regional-indicator flag
 * sequences. Plain SVG rectangles render identically everywhere.
 */
function MoldovaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden>
      <rect width="1" height="2" x="0" fill="#003DA5" />
      <rect width="1" height="2" x="1" fill="#FFD200" />
      <rect width="1" height="2" x="2" fill="#CC092F" />
    </svg>
  );
}

function RussiaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 3 2" className={className} aria-hidden>
      <rect width="3" height="2" fill="#FFFFFF" />
      <rect width="3" height="1.3333" y="0.6667" fill="#0039A6" />
      <rect width="3" height="0.6667" y="1.3333" fill="#D52B1E" />
    </svg>
  );
}

const FLAG_SVG_CLASS =
  "h-3.5 w-[1.3125rem] shrink-0 rounded-[2px] ring-1 ring-inset ring-ink/10";

type FlagIconProps = {
  code: Region["code"];
  className?: string;
};

export function FlagIcon({ code, className }: FlagIconProps) {
  if (code === "MD") return <MoldovaFlag className={className ?? FLAG_SVG_CLASS} />;
  if (code === "RU") return <RussiaFlag className={className ?? FLAG_SVG_CLASS} />;
  return <Globe className={className ?? "h-3.5 w-3.5 shrink-0 text-ink"} strokeWidth={1.75} aria-hidden />;
}
