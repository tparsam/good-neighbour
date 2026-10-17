import type { Region, RegionKind } from './types.ts'

const KINDS: Record<string, RegionKind> = {
  road: 'road',
  neighbour: 'neighbour',
  neighbor: 'neighbour',
  vehicle: 'vehicle',
}

// Nova returns box corners on a 0 to 1000 scale. The Ring API uses 0 to 1.
const unit = (value: number) => Math.min(1, Math.max(0, value / 1000))

function toRegion(raw: any): Region | null {
  const kind = typeof raw?.kind === 'string' ? KINDS[raw.kind.trim().toLowerCase()] : undefined
  const box = raw?.box
  if (!kind || !Array.isArray(box) || box.length !== 4 || !box.every(v => typeof v === 'number' && Number.isFinite(v))) {
    return null
  }
  const [ax, ay, bx, by] = box.map(unit)
  const region: Region = {
    kind,
    box: { x1: Math.min(ax, bx), y1: Math.min(ay, by), x2: Math.max(ax, bx), y2: Math.max(ay, by) },
  }
  return region.box.x2 > region.box.x1 && region.box.y2 > region.box.y1 ? region : null
}

/** Reads the model's reply. A region it cannot make sense of is skipped; a reply with no
 *  regions list at all is "no answer" (null), which is different from "nothing found" ([]). */
export function parseRegions(text: string): Region[] | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  let data: any
  let recovered = false
  try {
    data = JSON.parse(text.slice(start, end + 1))
  } catch {
    // Nova sometimes wraps good regions in broken JSON (a stray bracket), so each complete
    // region object is read on its own. If none can be read, it is still no answer.
    const found = [...text.matchAll(/\{[^{}]*"kind"[^{}]*\}/g)].flatMap(m => {
      try {
        return [JSON.parse(m[0])]
      } catch {
        return []
      }
    })
    if (found.length === 0) return null
    data = { regions: found }
    recovered = true
  }
  if (!Array.isArray(data?.regions)) return null
  // ponytail: at most 30 regions are read; a camera view never needs more.
  const regions = data.regions.slice(0, 30).map(toRegion).filter((r: Region | null): r is Region => r !== null)
  return recovered && regions.length === 0 ? null : regions
}
