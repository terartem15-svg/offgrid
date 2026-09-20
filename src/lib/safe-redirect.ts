/**
 * Where to send the user after signing in, from the untrusted `callbackUrl` query parameter.
 *
 * Only same-origin targets are honoured. The value is resolved the way the browser would resolve
 * it (`new URL(raw, origin)`), so tricks such as `//evil.example`, `/\evil.example`, tab or
 * newline characters inside the path, and `javascript:` URLs all end up with a different origin
 * and are rejected. A same-origin absolute URL is returned as a plain path.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  origin: string,
  fallback = "/account",
): string {
  if (!raw) return fallback;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
