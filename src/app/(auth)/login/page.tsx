"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { safeCallbackUrl } from "@/lib/safe-redirect";

function LoginForm() {
  const t = useTranslations().auth.login;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    }).catch(() => null);

    setLoading(false);
    if (!result) {
      setError(t.errorGeneric);
      return;
    }
    if (result.error) {
      // `code` is set by the server when the sign-in was blocked by the attempt limit.
      setError(result.code === "too_many_attempts" ? t.tooManyAttempts : t.invalidCredentials);
      return;
    }
    // `callbackUrl` comes from the query string, so it must never take the user off this site.
    router.push(safeCallbackUrl(searchParams.get("callbackUrl"), window.location.origin));
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-[0.14em] text-ink">
        {t.title}
      </h1>
      <p className="mt-2 text-sm text-ink/50">{t.testAccount}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">{t.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? t.signingIn : t.signIn}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        {t.noAccount}{" "}
        <Link href="/register" className="font-medium text-ink underline underline-offset-4">
          {t.createOne}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
