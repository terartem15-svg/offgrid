import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Gate for admin pages and server actions alike — pages get the layout
 * check, but actions are callable directly over the Server Actions RPC
 * endpoint regardless of which page rendered them, so every mutation must
 * re-check this itself rather than relying on the layout alone.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }
  return session;
}
