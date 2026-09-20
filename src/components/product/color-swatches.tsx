import type { ProductColor } from "@/lib/products";
import { cn } from "@/lib/utils";

type ColorSwatchesProps = {
  colors: ProductColor[];
  value: string;
  onChange: (name: string) => void;
  /** Colors with zero stock across every size — render dimmed and unselectable. */
  outOfStockColors?: Set<string>;
};

export function ColorSwatches({ colors, value, onChange, outOfStockColors }: ColorSwatchesProps) {
  return (
    <div className="flex items-center gap-3">
      {colors.map((color) => {
        const active = color.name === value;
        const outOfStock = outOfStockColors?.has(color.name) ?? false;
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            disabled={outOfStock}
            aria-label={color.name}
            aria-pressed={active}
            className={cn(
              "relative h-8 w-8 rounded-full ring-1 ring-inset ring-ink/15 transition",
              active && "ring-2 ring-ink ring-offset-2",
              outOfStock && "cursor-not-allowed opacity-30",
            )}
            style={{ backgroundColor: color.hex }}
          />
        );
      })}
    </div>
  );
}
