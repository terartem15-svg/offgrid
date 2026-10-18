"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  // Clamped in case the list shrinks under a kept selection.
  const activeImage = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`${name} — ${i + 1}`}
            aria-pressed={i === active}
            className={cn(
              "relative h-20 w-16 overflow-hidden rounded-md border bg-paper transition",
              i === active ? "border-ink" : "border-transparent hover:border-ink/30",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-lg bg-paper">
        {activeImage && (
          <Image
            src={activeImage}
            alt={name}
            fill
            priority
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
