"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { formatPrice } from "@/lib/format";
import type { SearchResultItem } from "@/lib/products";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const id = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { results: SearchResultItem[] }) => setResults(data.results))
        .catch((err) => {
          if (err.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div onClick={onClose} className="absolute inset-0 bg-ink/40" />

      <div className="absolute inset-x-0 top-0 mx-auto max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-b-lg bg-white shadow-xl sm:top-16 sm:rounded-lg">
        <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-ink/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search products or brands…"
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink/40" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <p className="px-5 py-10 text-center text-sm text-ink/40">
              Start typing to search the catalog.
            </p>
          ) : !loading && results.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink/40">
              No products match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {results.map((product) => (
                <li key={product.slug}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-paper"
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-paper">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">
                        {product.brand}
                      </p>
                      <p className="truncate text-sm font-medium text-ink">
                        {product.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
