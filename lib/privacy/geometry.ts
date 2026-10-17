import type { Box, Point, Region, RegionKind, Zone } from './types.ts'

// ponytail: areas are measured by sampling a GRID x GRID lattice of points, not by exact
// polygon clipping. It is accurate to about 1% of the frame, which is finer than the
// vision model's boxes. Use a polygon-clipping routine if exact areas are ever needed.
const GRID = 100

/** A region is suggested unless at least this share of it is already hidden. */
export const HIDDEN_ENOUGH = 0.8
/** Zones smaller than this share of the frame are not suggested. Distant houses are often under
 *  1%, and with only two zones allowed the limit, not this floor, keeps suggestions few. */
export const TOO_SMALL = 0.003

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

/** Ring's help: "You can make up to two Privacy Zones for each Ring device you have", drawn as boxes. */
export const MAX_ZONES = 2
/** Two areas share a zone for free if the shared box adds less than this share of the frame. */
const FREE_MERGE = 0.005

export interface Suggestion {
  /** What the zone covers, the biggest first. */
  kinds: RegionKind[]
  zone: Zone
}

interface Group {
  box: Box
  members: Region[]
  /** Share of the frame these areas take up that is not yet hidden by a zone. */
  exposed: number
}

const boxArea = (box: Box) => (box.x2 - box.x1) * (box.y2 - box.y1)
const around = (a: Box, b: Box): Box => ({
  x1: Math.min(a.x1, b.x1),
  y1: Math.min(a.y1, b.y1),
  x2: Math.max(a.x2, b.x2),
  y2: Math.max(a.y2, b.y2),
})
// ponytail: the waste of a shared box is its area minus its members' areas, so overlapping
// members count twice and look cheaper to merge. Good enough to choose between a few boxes.
const waste = (a: Group, b: Group) =>
  Math.max(0, boxArea(around(a.box, b.box)) - [...a.members, ...b.members].reduce((sum, r) => sum + boxArea(r.box), 0))

/** At most as many zones as Ring has left on the camera, covering as much of what is not the
 *  owner's as possible. Areas already mostly hidden are left alone. When there are more areas
 *  than zones, two areas share one box if that hides little else, otherwise the smallest area
 *  is left out, whichever costs less. Areas next to each other always share a box. */
export function suggestZones(regions: Region[], zones: Zone[]): Suggestion[] {
  const slots = Math.max(0, MAX_ZONES - zones.length)
  let groups: Group[] = []
  for (const region of regions) {
    const { total, hidden } = sample(p => inBox(p, region.box), zones)
    if (total === 0 || hidden / total >= HIDDEN_ENOUGH) continue
    groups.push({ box: region.box, members: [region], exposed: (total - hidden) / (GRID * GRID) })
  }

  for (;;) {
    let pair: [number, number] | null = null
    let pairCost = Infinity
    for (let i = 0; i < groups.length; i++)
      for (let j = i + 1; j < groups.length; j++) {
        const cost = waste(groups[i], groups[j])
        if (cost < pairCost) [pair, pairCost] = [[i, j], cost]
      }
    const smallest = groups.reduce((min, g, i) => (g.exposed < groups[min].exposed ? i : min), 0)
    const tooMany = groups.length > slots

    if (pair && (pairCost <= FREE_MERGE || (tooMany && pairCost <= groups[smallest].exposed))) {
      const [a, b] = [groups[pair[0]], groups[pair[1]]]
      groups = groups.filter((_, i) => i !== pair![0] && i !== pair![1])
      groups.push({ box: around(a.box, b.box), members: [...a.members, ...b.members], exposed: a.exposed + b.exposed })
    } else if (tooMany) {
      groups.splice(smallest, 1)
    } else break
  }

  return groups
    .filter(g => boxArea(g.box) >= TOO_SMALL)
    .sort((a, b) => b.exposed - a.exposed)
    .map(g => ({
      kinds: [...new Set([...g.members].sort((a, b) => boxArea(b.box) - boxArea(a.box)).map(r => r.kind))],
      zone: boxToZone(g.box),
    }))
}
