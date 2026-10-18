export const RING_API = 'https://api.amazonvision.com'

/** The Ring session URL to act on, or null if it does not point at the Ring API.
 *  The Ring token is sent with the request, so it must never go to any other address. */
export function ringSessionUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw === '') return null
  try {
    const url = new URL(raw, RING_API)
    return url.origin === RING_API && url.username === '' ? url : null
  } catch {
    return null
  }
}

/** The header that carries a Ring access token pasted by the visitor, for a copy with no Ring account of its own. */
export const RING_TOKEN_HEADER = 'x-ring-token'

/** The visitor's pasted Ring token, or null if none was sent. Throws if it cannot be a token,
 *  so a bad paste gets a clear answer instead of an odd failure from Ring. */
export function visitorToken(raw: string | null): string | null {
  const token = (raw ?? '').trim().replace(/^Bearer\s+/i, '')
  if (token === '') return null
  if (!/^[\x21-\x7e]{20,4096}$/.test(token)) {
    throw new Error('That is not a Ring access token. Copy the whole token from the Ring Developer Playground.')
  }
  return token
}
