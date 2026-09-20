/**
 * The address of the client that sent a request, or null when it cannot be told.
 *
 * Vercel (and most proxies) put the real client first in X-Forwarded-For; everything after it is
 * proxies the request passed through, so only the first entry is used.
 */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return request.headers.get("x-real-ip");
}
