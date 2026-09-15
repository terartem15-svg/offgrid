import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
          Account
        </h1>
        <p className="mt-3 text-sm text-ink/60">
          Sign in to view your orders and account details.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            Sign In
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
            My Account
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {session.user.name ?? session.user.email} · {session.user.email}
            {session.user.role === "ADMIN" && (
              <span className="ml-2 rounded-md bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
                Admin
              </span>
            )}
          </p>
        </div>
        <SignOutButton />
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
        Order History
      </h2>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/catalog" className="underline underline-offset-4">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-ink">{order.number}</p>
                <p className="text-xs text-ink/50">
                  {order.createdAt.toLocaleDateString()} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} ·{" "}
                  <span className="capitalize">{order.status.toLowerCase()}</span>
                </p>
              </div>
              <span className="text-sm font-semibold text-ink">
                {formatPrice(order.total / 100)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
