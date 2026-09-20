"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

// Only intercept plain left-clicks so ctrl/cmd/shift/middle-click still open
// the link's real href in a new tab or window.
function isPlainClick(e: MouseEvent<HTMLAnchorElement>) {
  return e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
}

/**
 * Click handlers for the header's "Home" and "Contact" links, shared by the
 * desktop nav and the mobile drawer.
 *
 * `scrollTo()` without `behavior` defers to the CSS `scroll-behavior` on
 * <html> (globals.css), so these animate smoothly unless the user prefers
 * reduced motion.
 */
export function useNavClickHandlers() {
  const pathname = usePathname();

  // On the homepage a <Link href="/"> is a no-op, so scroll to the top instead.
  const onHomeClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/" || !isPlainClick(e)) return;
    e.preventDefault();
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
    window.scrollTo({ top: 0 });
  };

  // "Contact" glides to the footer of whichever page we're on.
  const onContactClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    window.scrollTo({ top: document.documentElement.scrollHeight });
  };

  return { onHomeClick, onContactClick };
}
