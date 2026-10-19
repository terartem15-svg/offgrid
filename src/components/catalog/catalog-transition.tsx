"use client";

import { createContext, useContext, useTransition, type ReactNode, type TransitionStartFunction } from "react";

import { cn } from "@/lib/utils";

/**
 * Filter changes navigate to a new catalog URL, and the page is rendered on the
 * server, so the new results take a server round trip to arrive. The filter
 * sidebar and the results share one transition: the sidebar shows the new
 * selection immediately (see `FilterSidebar`) and the results dim while the
 * server works, instead of the page looking frozen until the response lands.
 */
type CatalogTransition = { isPending: boolean; startTransition: TransitionStartFunction };

const CatalogTransitionContext = createContext<CatalogTransition | null>(null);

export function CatalogTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <CatalogTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </CatalogTransitionContext.Provider>
  );
}

export function useCatalogTransition(): CatalogTransition {
  const context = useContext(CatalogTransitionContext);
  if (!context) throw new Error("useCatalogTransition must be used inside CatalogTransitionProvider");
  return context;
}

/** The product grid and pagination: dimmed and marked busy while new results load. */
export function CatalogResults({ children }: { children: ReactNode }) {
  const { isPending } = useCatalogTransition();
  return (
    <div
      aria-busy={isPending}
      className={cn("flex-1 transition-opacity duration-150", isPending && "opacity-50")}
    >
      {children}
    </div>
  );
}
