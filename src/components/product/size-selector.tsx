import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  sizes: string[];
  value: string | null;
  onChange: (size: string) => void;
};

export function SizeSelector({ sizes, value, onChange }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const active = size === value;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            aria-pressed={active}
            className={cn(
              "h-11 min-w-[3.25rem] rounded-md border px-3 text-sm font-medium transition-colors",
              active
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
