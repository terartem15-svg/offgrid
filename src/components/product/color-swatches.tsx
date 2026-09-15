import type { ProductColor } from "@/lib/products";
import { cn } from "@/lib/utils";

type ColorSwatchesProps = {
  colors: ProductColor[];
  value: string;
  onChange: (name: string) => void;
};

export function ColorSwatches({ colors, value, onChange }: ColorSwatchesProps) {
  return (
    <div className="flex items-center gap-3">
      {colors.map((color) => {
        const active = color.name === value;
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.name)}
            aria-label={color.name}
            aria-pressed={active}
            className={cn(
              "relative h-8 w-8 rounded-full ring-1 ring-inset ring-ink/15 transition",
              active && "ring-2 ring-ink ring-offset-2",
            )}
            style={{ backgroundColor: color.hex }}
          />
        );
      })}
    </div>
  );
}
