import type { Prisma } from "@prisma/client";

/**
 * Human-readable, sequential per year — e.g. `OG-2026-000123`. Shared by checkout and quick-buy.
 *
 * Call it with the transaction that creates the order. The number comes from a per-year
 * counter row that is incremented atomically (Prisma compiles the upsert to a single
 * `INSERT … ON CONFLICT DO UPDATE`), so concurrent orders queue on that row's lock and each
 * gets a distinct number. Because the increment is part of the caller's transaction, a rollback
 * (e.g. out of stock) hands the number back and leaves no gap.
 */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const { value } = await tx.orderCounter.upsert({
    where: { year },
    create: { year, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `OG-${year}-${String(value).padStart(6, "0")}`;
}
