/** Frames that may be sent to Bedrock per server run. A value that is not a plain
 *  non-negative number falls back to the default, so a typo can never remove the cap. */
export function frameCap(value: string | undefined, fallback = 2000): number {
  if (value === undefined || value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}
