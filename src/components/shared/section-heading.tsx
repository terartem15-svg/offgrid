import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  align?: "center" | "left";
  action?: { label: string; href: string };
  className?: string;
};

export function SectionHeading({
  title,
  align = "center",
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8 flex items-end gap-4",
        align === "center" ? "flex-col text-center" : "justify-between",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink sm:text-3xl">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 hover:text-ink"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
