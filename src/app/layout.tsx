import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import "./globals.css";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartSessionSync } from "@/components/cart/cart-session-sync";
import { NotificationBar } from "@/components/layout/notification-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WishlistDrawer } from "@/components/wishlist/wishlist-drawer";
import { WishlistSessionSync } from "@/components/wishlist/wishlist-session-sync";

// Romanian (ș, ț, ă) needs latin-ext and Russian needs cyrillic — without them those
// languages fall back to a system font mid-sentence.
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "OFFGRID — Multi-brand fashion",
    template: "%s — OFFGRID",
  },
  description:
    "OFFGRID is a multi-brand fashion store: Balenciaga, Nike, Puma, Stone Island, Off-White and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The server renders the default region's language (English); RegionSwitcher keeps
    // `lang` in step once the visitor's saved choice is known.
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink">
        <SessionProvider>
          <NotificationBar />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
          <CartSessionSync />
          <WishlistDrawer />
          <WishlistSessionSync />
        </SessionProvider>
      </body>
    </html>
  );
}
