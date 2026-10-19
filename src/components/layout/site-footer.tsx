"use client";

import Link from "next/link";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { useTranslations } from "@/lib/i18n";

// Only links with a real destination. The demo has no shipping, returns,
// privacy, FAQ, size-guide or terms pages and no social accounts, so those
// entries (which used to point at "/" or at instagram.com itself) are gone;
// order tracking is the account page's order history. `labels` names the
// dictionary group a link's text comes from.
const FOOTER_COLUMNS = [
  {
    key: "shop",
    links: [
      { key: "allProducts", href: "/catalog", labels: "shop" },
      { key: "hoodies", href: "/catalog?category=hoodies", labels: "shop" },
      { key: "tshirts", href: "/catalog?category=tshirts", labels: "shop" },
      { key: "pants", href: "/catalog?category=pants", labels: "shop" },
      { key: "jackets", href: "/catalog?category=jackets", labels: "shop" },
      { key: "accessories", href: "/catalog?category=accessories", labels: "shop" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "aboutUs", href: "/about", labels: "company" },
      { key: "contactUs", href: "/contact", labels: "company" },
      { key: "trackOrder", href: "/account", labels: "help" },
    ],
  },
] as const;

// FOOTER_COLUMNS mixes column shapes with different link keys, so a generic
// `.map()` over it widens `link.key` to the union of every column's keys —
// this narrows the lookup back down without an `any` cast.
function pickLink(links: Record<string, string>, key: string): string {
  return links[key];
}

export function SiteFooter() {
  const t = useTranslations().footer;

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(2,1fr)_1.4fr]">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.24em]">OFFGRID</p>
            <p className="mt-4 max-w-xs text-sm text-white/50">{t.tagline}</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.key}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                {t.columns[column.key].title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {pickLink(t.columns[link.labels].links, link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              {t.newsletter.title}
            </p>
            <p className="mt-4 text-sm text-white/50">{t.newsletter.blurb}</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} OFFGRID. {t.rights}
        </div>
      </div>
    </footer>
  );
}
