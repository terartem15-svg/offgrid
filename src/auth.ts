import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { clientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";

// Sign-in attempts are counted per email (blocks guessing one account's password) and per
// client IP (blocks trying many accounts). A successful sign-in clears that email's counter.
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_PER_EMAIL = 10;
const LOGIN_MAX_PER_IP = 50;

/** Surfaces to the client as `result.code === "too_many_attempts"` so the form can say so. */
class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const normalizedEmail = email.trim().toLowerCase().slice(0, 254);
        const emailKey = `login:email:${normalizedEmail}`;
        const [byEmail, byIp] = await Promise.all([
          consumeRateLimit(emailKey, LOGIN_MAX_PER_EMAIL, LOGIN_WINDOW_SECONDS),
          consumeRateLimit(`login:ip:${clientIp(request) ?? "unknown"}`, LOGIN_MAX_PER_IP, LOGIN_WINDOW_SECONDS),
        ]);
        if (!byEmail.allowed || !byIp.allowed) throw new TooManyAttemptsError();

        // Sign-up stores emails lowercased; the case-insensitive match also finds accounts
        // created before that, so "Anna@Mail.com" can sign in however it is typed.
        const user = await prisma.user.findFirst({
          where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await resetRateLimit(emailKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "CUSTOMER" | "ADMIN";
      return session;
    },
  },
});
