import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import "./globals.css";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { NotificationBar } from "@/components/layout/notification-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink">
        <SessionProvider>
          <NotificationBar />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CartDrawer />
        </SessionProvider>
      </body>
    </html>
  );
}
