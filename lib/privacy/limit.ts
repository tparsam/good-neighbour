/** Frames that may be sent to Bedrock per server run. A value that is not a plain
 *  non-negative number falls back to the default, so a typo can never remove the cap. */
export function frameCap(value: string | undefined, fallback = 2000): number {
  if (value === undefined || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

/** Allows each visitor `max` checks per `windowMs`. Returns a function: allow(visitor, now).
 *  ponytail: counts live in this server's memory, so a hosted app with several instances, or
 *  one that restarts, can allow a little more. The hard cost stops are the demo key's expiry
 *  and the AWS budget; a shared store (e.g. Redis) would make this exact if ever needed. */
export function visitorLimit(max: number, windowMs: number) {
  const seen = new Map<string, { start: number; count: number }>()
  return (visitor: string, now = Date.now()) => {
    const entry = seen.get(visitor)
    if (!entry || now - entry.start >= windowMs) {
      if (seen.size > 10_000) seen.clear() // keeps memory bounded if many visitors pass through
      seen.set(visitor, { start: now, count: 1 })
      return true
    }
    entry.count++
    return entry.count <= max
  }
}
