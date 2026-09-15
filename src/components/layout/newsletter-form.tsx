"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    // TODO: wire to a real subscribe endpoint / Server Action.
    setSubmitted(true);
    setEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="h-11 w-full rounded-md border border-white/20 bg-transparent px-3 text-sm text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-0"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-ink hover:bg-white/90"
      >
        {submitted ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
