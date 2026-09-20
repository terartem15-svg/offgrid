"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type InfoSection = { heading: string; items: string[] };

type InfoModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: InfoSection[];
};

/** How long the slide/fade transition takes — kept unmounted after this so it never blocks input. */
const TRANSITION_MS = 300;

/**
 * Full detail popup for the shipping/returns/secure-payment tiles — a
 * floating overlay instead of an inline expand, so opening it never shifts
 * the gallery or the rest of the page. Slides up and fades in/out rather
 * than snapping open, and stays mounted for the closing animation.
 */
export function InfoModal({ open, onClose, title, sections }: InfoModalProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      // A single rAF can still land before the browser paints the initial
      // (hidden) state, coalescing both style changes into one frame with
      // no visible transition — nesting two rAFs guarantees a paint happens
      // in between, so the "slide up" is actually seen.
      let innerFrame = 0;
      const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outerFrame);
        cancelAnimationFrame(innerFrame);
      };
    }
    setVisible(false);
    const timeout = window.setTimeout(() => setRendered(false), TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!rendered) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-300 ease-out",
          visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-8 py-5">
          <h2 className="text-base font-semibold uppercase tracking-[0.14em] text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink/50 hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-x-10 gap-y-6 overflow-y-auto px-8 py-6 sm:grid-cols-2">
          {sections.map((section) => (
            <div key={section.heading}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/50">
                {section.heading}
              </p>
              <ul className="mt-3 space-y-2.5">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/40" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
