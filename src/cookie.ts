import type { CookieOptions } from './types.js';

/** What is stored in the cookie: revision, timestamp and the allowed optional categories. */
export interface StoredConsent {
  r: string;
  t: number;
  c: string[];
}

export type ResolvedCookieOptions = Required<Omit<CookieOptions, 'domain'>> & { domain?: string };

/** Reads and validates the consent cookie. Returns `null` when it is missing or malformed. */
export function readConsentCookie(cookieHeader: string, name: string): StoredConsent | null {
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(';')) {
    const pair = part.trim();
    if (!pair.startsWith(prefix)) continue;
    try {
      const v = JSON.parse(decodeURIComponent(pair.slice(prefix.length)));
      if (v && typeof v.r === 'string' && typeof v.t === 'number' && Array.isArray(v.c)) {
        return { r: v.r, t: v.t, c: v.c.filter((x: unknown) => typeof x === 'string') };
      }
    } catch {
      // A malformed cookie counts as no choice.
    }
    return null;
  }
  return null;
}

/** Builds the `Set-Cookie`-style string for `document.cookie`. Pass `null` to delete the cookie. */
export function serializeConsentCookie(
  value: StoredConsent | null,
  options: ResolvedCookieOptions,
  secure: boolean,
): string {
  const parts = [
    `${options.name}=${value ? encodeURIComponent(JSON.stringify(value)) : ''}`,
    `Path=${options.path}`,
    `Max-Age=${value ? Math.round(options.days * 86400) : 0}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (secure || options.sameSite === 'None') parts.push('Secure');
  return parts.join('; ');
}
