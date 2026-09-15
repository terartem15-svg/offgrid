import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        solid: "bg-ink text-white",
        subtle: "bg-ink/[0.06] text-ink",
        sale: "bg-red-600 text-white",
        outline: "border border-ink/20 text-ink",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
