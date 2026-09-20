import Link from "next/link";

import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  pageCount: number;
  buildHref: (page: number) => string;
};

/** Numbered page links for the catalog grid — hidden when everything fits on one page. */
export function Pagination({ currentPage, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors",
            page === currentPage
              ? "border-ink bg-ink text-white"
              : "border-ink/20 bg-white text-ink hover:border-ink",
          )}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}
