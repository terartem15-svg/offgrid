import Link from "next/link";

import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-48">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
            Admin
          </p>
          <nav className="mt-4 flex flex-row gap-1 lg:flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
