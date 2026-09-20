import { prisma } from "@/lib/prisma";

/** Human-readable, sequential per year — e.g. `OG-2026-000123`. Shared by checkout and quick-buy. */
export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { number: { startsWith: `OG-${year}-` } },
  });
  return `OG-${year}-${String(count + 1).padStart(6, "0")}`;
}
