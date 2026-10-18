"use client";

import Link from "next/link";
import { Instagram, Twitter, Youtube } from "lucide-react";

import { NewsletterForm } from "@/components/layout/newsletter-form";
import { useTranslations } from "@/lib/i18n";

const FOOTER_COLUMNS = [
  {
    key: "shop",
    links: [
      { key: "allProducts", href: "/catalog" },
      { key: "hoodies", href: "/catalog?category=hoodies" },
      { key: "tshirts", href: "/catalog?category=tshirts" },
      { key: "pants", href: "/catalog?category=pants" },
      { key: "jackets", href: "/catalog?category=jackets" },
      { key: "accessories", href: "/catalog?category=accessories" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "aboutUs", href: "/about" },
      { key: "contactUs", href: "/contact" },
      { key: "shipping", href: "/" },
      { key: "returns", href: "/" },
      { key: "privacy", href: "/" },
    ],
  },
  {
    key: "help",
    links: [
      { key: "faqs", href: "/" },
      { key: "trackOrder", href: "/" },
      { key: "sizeGuide", href: "/" },
      { key: "terms", href: "/" },
    ],
  },
] as const;

const SOCIALS = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

// FOOTER_COLUMNS mixes three column shapes with different link keys, so a
// generic `.map()` over it widens `link.key` to the union of every column's
// keys — this narrows the lookup back down without an `any` cast.
function pickLink(links: Record<string, string>, key: string): string {
  return links[key];
}

export function SiteFooter() {
  const t = useTranslations().footer;

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(3,1fr)_1.4fr]">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.24em]">OFFGRID</p>
            <p className="mt-4 max-w-xs text-sm text-white/50">{t.tagline}</p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
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
                      {pickLink(t.columns[column.key].links, link.key)}
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
