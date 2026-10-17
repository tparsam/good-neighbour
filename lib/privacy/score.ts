import type { Region } from './types.ts'

/** Whether a box the model found counts as finding an expected area: the same kind, and either
 *  covering at least 30% of the expected area or centred inside it (one car found in a row of
 *  parked cars still counts). */
export function matches(found: Region, expected: Region): boolean {
  if (found.kind !== expected.kind) return false
  const g = found.box
  const w = expected.box
  const x = Math.min(g.x2, w.x2) - Math.max(g.x1, w.x1)
  const y = Math.min(g.y2, w.y2) - Math.max(g.y1, w.y1)
  const covered = x > 0 && y > 0 ? (x * y) / ((w.x2 - w.x1) * (w.y2 - w.y1)) : 0
  const cx = (g.x1 + g.x2) / 2
  const cy = (g.y1 + g.y2) / 2
  return covered >= 0.3 || (cx >= w.x1 && cx <= w.x2 && cy >= w.y1 && cy <= w.y2)
}

/** The 95% Wilson score interval for `k` successes out of `n`: the range the true share
 *  probably lies in, given a sample this size. */
export function wilson(k: number, n: number, z = 1.959964): [number, number] {
  if (n === 0) return [0, 1]
  const p = k / n
  const d = 1 + (z * z) / n
  const centre = (p + (z * z) / (2 * n)) / d
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)]
}

