"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { useTranslations } from "@/lib/i18n";

/**
 * Newsletter sign-up for the demo store. There is no mailing list behind it:
 * the address is checked by the browser and then dropped, and the form says
 * so instead of pretending the subscription went through.
 */
export function NewsletterForm() {
  const t = useTranslations().footer.newsletter;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm">
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSubmitted(false);
          }}
          placeholder={t.placeholder}
          className="h-11 w-full rounded-md border border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-0"
        />
        <button
          type="submit"
          aria-label={t.subscribe}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-ink hover:bg-white/90"
        >
          {submitted ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      <p role="status" className="mt-2 min-h-[1rem] text-xs text-white/50">
        {submitted ? t.demoNote : ""}
      </p>
    </form>
  );
}
