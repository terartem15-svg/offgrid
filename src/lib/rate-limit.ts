import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  /** false once more than `limit` attempts were counted in the current window. */
  allowed: boolean;
  /** Seconds until the current window ends and the counter starts again. */
  retryAfterSeconds: number;
};

/**
 * Counts one attempt for `key` and says whether it is still within `limit` attempts per
 * `windowSeconds` (fixed window, starting with the first attempt).
 *
 * The whole read-modify-write is one `INSERT ... ON CONFLICT DO UPDATE`, so concurrent requests
 * cannot both read the same count and slip past the limit. Time comes from the database clock
 * (stored as UTC, like the values Prisma writes), which keeps every serverless instance on the
 * same clock.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const [row] = await prisma.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now() AT TIME ZONE 'UTC')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= (now() AT TIME ZONE 'UTC') - make_interval(secs => (${windowSeconds})::double precision)
        THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= (now() AT TIME ZONE 'UTC') - make_interval(secs => (${windowSeconds})::double precision)
        THEN (now() AT TIME ZONE 'UTC') ELSE "RateLimit"."windowStart" END
    RETURNING
      "count",
      GREATEST(
        0,
        CEIL(EXTRACT(EPOCH FROM ("windowStart" + make_interval(secs => (${windowSeconds})::double precision) - (now() AT TIME ZONE 'UTC'))))
      )::int AS "retryAfter"
  `;
  return { allowed: row.count <= limit, retryAfterSeconds: row.retryAfter };
}

/** Forgets the attempts counted for `key`, e.g. after a successful sign-in. */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/** Removes counters whose window ended long ago, so the table does not grow without bound. */
export async function deleteExpiredRateLimits(olderThanSeconds = 24 * 60 * 60): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - olderThanSeconds * 1000) } },
  });
  return count;
}
