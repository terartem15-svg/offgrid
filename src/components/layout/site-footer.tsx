import Link from "next/link";
import { Instagram, Twitter, Youtube } from "lucide-react";

import { NewsletterForm } from "@/components/layout/newsletter-form";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/catalog" },
      { label: "Hoodies", href: "/catalog?category=hoodies" },
      { label: "T-Shirts", href: "/catalog?category=t-shirts" },
      { label: "Pants", href: "/catalog?category=pants" },
      { label: "Jackets", href: "/catalog?category=jackets" },
      { label: "Accessories", href: "/catalog?category=accessories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/" },
      { label: "Contact Us", href: "/" },
      { label: "Shipping & Delivery", href: "/" },
      { label: "Returns & Refunds", href: "/" },
      { label: "Privacy Policy", href: "/" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "/" },
      { label: "Track Your Order", href: "/" },
      { label: "Size Guide", href: "/" },
      { label: "Terms & Conditions", href: "/" },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(3,1fr)_1.4fr]">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.24em]">OFFGRID</p>
            <p className="mt-4 max-w-xs text-sm text-white/50">
              Multi-brand fashion for people who dress off the grid. Curated
              labels, authenticated pieces, shipped worldwide.
            </p>
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
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
              Newsletter
            </p>
            <p className="mt-4 text-sm text-white/50">
              Get exclusive updates on new drops and special offers.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} OFFGRID. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
