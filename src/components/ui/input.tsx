import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-ink disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink/70", className)}
    {...props}
  />
);
