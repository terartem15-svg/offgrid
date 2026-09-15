import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <Image
        src="https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=2000&q=80"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          New Arrivals
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
          Off the grid.
          <br />
          On the radar.
        </h1>
        <p className="mt-6 max-w-md text-sm text-white/70">
          Balenciaga, Nike, Stone Island and more — authenticated, curated and
          priced for the people who actually wear it.
        </p>
        <div className="mt-8">
          <Link
            href="/catalog"
            className={cn(buttonVariants({ variant: "inverted", size: "lg" }))}
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
}
