import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  className?: string;
};

export function StarRating({ rating, reviewCount, className }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.round(rating)
                ? "fill-ink text-ink"
                : "fill-transparent text-ink/25",
            )}
          />
        ))}
      </div>
      <span className="text-sm text-ink/60">
        {rating.toFixed(1)}
        {typeof reviewCount === "number" && ` (${reviewCount} reviews)`}
      </span>
    </div>
  );
}
