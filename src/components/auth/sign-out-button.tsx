"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

export function SignOutButton() {
  const t = useTranslations().account;

  return (
    <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      {t.signOut}
    </Button>
  );
}
