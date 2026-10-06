// A cheap check for "has the picture changed since the last frame we paid to analyse".
// The frame is reduced to a grid of average brightness values. The picture has changed
// if any single cell moved by CELL_DELTA or more, so a small bird in one corner counts
// even though the average over the whole frame barely moves.
//
// ponytail: fixed thresholds and brightness only. Tune COLS, ROWS and CELL_DELTA against
// real footage; if compression noise still triggers it, compare against a rolling average.

export const COLS = 32
export const ROWS = 18
export const CELL_DELTA = 12

export function thumbnail(frame: { data: ArrayLike<number>; width: number; height: number }): number[] {
  const { data, width, height } = frame
  const out: number[] = []
  for (let row = 0; row < ROWS; row++) {
    const y0 = Math.floor((row * height) / ROWS)
    const y1 = Math.max(y0 + 1, Math.floor(((row + 1) * height) / ROWS))
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.floor((col * width) / COLS)
      const x1 = Math.max(x0 + 1, Math.floor(((col + 1) * width) / COLS))
      let sum = 0
      let count = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4
          sum += (data[i] + data[i + 1] + data[i + 2]) / 3
          count++
        }
      }
      out.push(sum / count)
    }
  }
  return out
}

export function changed(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return true
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) >= CELL_DELTA) return true
  }
  return false
}
