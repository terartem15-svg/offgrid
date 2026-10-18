"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useLang, useTranslations } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Order dates are rendered on the server and again in the browser, so they use a fixed locale
 * and the shop's time zone — `toLocaleDateString()` with the runtime defaults printed a
 * different date format on each side and broke hydration.
 */
const DATE_LOCALE: Record<ReturnType<typeof useLang>, string> = { en: "en-GB", ro: "ro-RO", ru: "ru-RU" };
const SHOP_TIME_ZONE = "Europe/Chisinau";

type SignedOutViewProps = { kind: "signed-out" };

type OrderRow = {
  id: string;
  number: string;
  createdAt: Date;
  itemCount: number;
  status: keyof Dictionary["account"]["statusLabels"];
  totalCents: number;
};

type SignedInViewProps = {
  kind: "signed-in";
  name: string | null;
  email: string;
  isAdmin: boolean;
  orders: OrderRow[];
};

type AccountViewProps = SignedOutViewProps | SignedInViewProps;

/**
 * `AccountPage` is a server component (awaits `auth()` and Prisma) — this
 * client leaf owns every string that depends on the selected language.
 */
export function AccountView(props: AccountViewProps) {
  const t = useTranslations().account;
  const lang = useLang();

  if (props.kind === "signed-out") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
          {t.title}
        </h1>
        <p className="mt-3 text-sm text-ink/60">{t.signInPrompt}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            {t.signIn}
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
            {t.createAccount}
          </Link>
        </div>
      </div>
    );
  }

  const { name, email, isAdmin, orders } = props;
  const dateFormat = new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    dateStyle: "medium",
    timeZone: SHOP_TIME_ZONE,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
            {t.myAccount}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {name ?? email} · {email}
            {isAdmin && (
              <span className="ml-2 rounded-md bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
                {t.admin}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {t.adminPanel}
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">
        {t.orderHistory}
      </h2>

      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">
          {t.noOrders}{" "}
          <Link href="/catalog" className="underline underline-offset-4">
            {t.startShopping}
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
                  {dateFormat.format(order.createdAt)} · {order.itemCount}{" "}
                  {order.itemCount === 1 ? t.item : t.items} ·{" "}
                  {t.statusLabels[order.status]}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink">
                {formatPrice(order.totalCents / 100)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
