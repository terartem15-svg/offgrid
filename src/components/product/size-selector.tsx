import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  sizes: string[];
  value: string | null;
  onChange: (size: string) => void;
  /** Stock for the currently selected color, by size — a size at 0 (or missing) renders disabled. */
  stockBySize?: Record<string, number>;
};

export function SizeSelector({ sizes, value, onChange, stockBySize }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const active = size === value;
        const outOfStock = (stockBySize?.[size] ?? 0) <= 0;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            disabled={outOfStock}
            aria-pressed={active}
            className={cn(
              "h-11 min-w-[3.25rem] rounded-md border px-3 text-sm font-medium transition-colors",
              outOfStock
                ? "cursor-not-allowed border-ink/10 text-ink/30 line-through"
                : active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-white text-ink hover:border-ink",
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
