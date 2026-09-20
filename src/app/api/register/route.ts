import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

// Sign-ups per client IP. Beyond stopping account spam, this limits how fast the "email already
// registered" answer below can be used to find out which addresses have an account.
const REGISTER_MAX_PER_IP = 10;
const REGISTER_WINDOW_SECONDS = 60 * 60;

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const limit = await consumeRateLimit(
    `register:ip:${clientIp(request) ?? "unknown"}`,
    REGISTER_MAX_PER_IP,
    REGISTER_WINDOW_SECONDS,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
