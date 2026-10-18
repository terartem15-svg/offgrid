import type { Metadata } from "next";

import { AccountView } from "@/components/account/account-view";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    return <AccountView kind="signed-out" />;
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <AccountView
      kind="signed-in"
      name={session.user.name ?? null}
      email={session.user.email ?? ""}
      isAdmin={session.user.role === "ADMIN"}
      orders={orders.map((order) => ({
        id: order.id,
        number: order.number,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
        status: order.status,
        totalCents: order.total,
      }))}
    />
  );
}
