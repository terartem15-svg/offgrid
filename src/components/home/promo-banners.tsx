import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { promoBanners } from "@/data/mock";
import { cn } from "@/lib/utils";

export function PromoBanners() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-4 md:grid-cols-3">
        {promoBanners.map((banner) => (
          <article
            key={banner.title}
            className="relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-lg bg-ink p-6 text-white"
          >
            <Image
              src={banner.image}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="relative">
              <p className="text-xl font-bold uppercase tracking-[0.12em]">
                {banner.title}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">
                {banner.subtitle}
              </p>
              <Link
                href={banner.href}
                className={cn(
                  buttonVariants({ variant: "inverted", size: "sm" }),
                  "mt-4",
                )}
              >
                {banner.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
