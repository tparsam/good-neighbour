import type { Box, Point, Region, RegionKind, Zone } from './types.ts'

// ponytail: areas are measured by sampling a GRID x GRID lattice of points, not by exact
// polygon clipping. It is accurate to about 1% of the frame, which is finer than the
// vision model's boxes. Use a polygon-clipping routine if exact areas are ever needed.
const GRID = 100

/** A region is suggested unless at least this share of it is already hidden. */
export const HIDDEN_ENOUGH = 0.8
/** Regions smaller than this share of the frame are ignored. */
export const TOO_SMALL = 0.01

/** Whether a point lies inside a polygon (ray casting). */
export function pointInZone(p: Point, zone: Zone): boolean {
  if (zone.length < 3) return false
  let inside = false
  for (let i = 0, j = zone.length - 1; i < zone.length; j = i++) {
    const a = zone[i]
    const b = zone[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

const inBox = (p: Point, box: Box) => p.x >= box.x1 && p.x < box.x2 && p.y >= box.y1 && p.y < box.y2

export const boxToZone = (box: Box): Zone => [
  { x: box.x1, y: box.y1 },
  { x: box.x2, y: box.y1 },
  { x: box.x2, y: box.y2 },
  { x: box.x1, y: box.y2 },
]

/** Counts lattice points for which `inside` holds, and how many of those also lie in a zone. */
function sample(inside: (p: Point) => boolean, zones: Zone[]) {
  let total = 0
  let hidden = 0
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const p = { x: (col + 0.5) / GRID, y: (row + 0.5) / GRID }
      if (!inside(p)) continue
      total++
      if (zones.some(zone => pointInZone(p, zone))) hidden++
    }
  }
  return { total, hidden }
}

export interface Coverage {
  /** Share of the frame that is not the owner's own property. */
  outside: number
  /** Share of the frame that is outside and already behind a privacy zone. */
  hidden: number
  /** Share of the frame that is outside and still recorded. */
  exposed: number
}

export function coverage(regions: Region[], zones: Zone[]): Coverage {
  const { total, hidden } = sample(p => regions.some(r => inBox(p, r.box)), zones)
  const points = GRID * GRID
  return { outside: total / points, hidden: hidden / points, exposed: (total - hidden) / points }
}

export interface Suggestion {
  kind: RegionKind
  zone: Zone
}

/** One suggested privacy zone per region that is big enough to matter and not already hidden.
 *  Larger regions are taken first, and a zone already suggested counts as hiding what lies
 *  under it, so a car parked on the road does not get a second zone inside the road's. */
export function suggestZones(regions: Region[], zones: Zone[]): Suggestion[] {
  const area = (r: Region) => (r.box.x2 - r.box.x1) * (r.box.y2 - r.box.y1)
  const suggestions: Suggestion[] = []
  for (const region of [...regions].sort((a, b) => area(b) - area(a))) {
    const covering = [...zones, ...suggestions.map(s => s.zone)]
    const { total, hidden } = sample(p => inBox(p, region.box), covering)
    if (total / (GRID * GRID) < TOO_SMALL) continue
    if (hidden / total >= HIDDEN_ENOUGH) continue
    suggestions.push({ kind: region.kind, zone: boxToZone(region.box) })
  }
  return suggestions
}
