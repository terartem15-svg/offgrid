"use client";

import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Hero() {
  const t = useTranslations().hero;

  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Image
        src="/hero.webp"
        alt=""
        fill
        priority
        quality={90}
        // object-cover in a ~560-572px tall section makes the 3:2 photo at least
        // ~860px wide, so narrow screens need more than "100vw" or they get a
        // small file stretched out of focus.
        sizes="(max-width: 860px) 860px, 100vw"
        // The face sits at the top of the frame, right of center: keep it in view
        // on wide screens (top) and on narrow ones (right of center).
        className="object-cover object-[72%_top]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          {t.eyebrow}
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
          {t.titleLine1}
          <br />
          {t.titleLine2}
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/70">{t.description}</p>
        <div className="mt-8">
          <Link
            href="/catalog"
            className={cn(buttonVariants({ variant: "inverted", size: "lg" }))}
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
