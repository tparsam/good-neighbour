import type { Confidence, Visit } from './types.ts'
import { keyOf, UNIDENTIFIED } from './visits.ts'

export interface Species {
  name: string
  visits: number
  firstSeen: number
  lastSeen: number
  snapshot?: string
}

export interface Today {
  species: number
  visits: number
  busiestHour: number | null
}

const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 }
const UNIDENTIFIED_KEY = keyOf(UNIDENTIFIED)

export function lifeList(visits: Visit[]): Species[] {
  const byKey = new Map<string, Species & { best: number }>()
  const ordered = [...visits].sort((a, b) => a.start - b.start)
  for (const v of ordered) {
    const key = keyOf(v.name)
    if (key === UNIDENTIFIED_KEY) continue
    const entry = byKey.get(key) ?? { name: v.name, visits: 0, firstSeen: v.start, lastSeen: v.start, best: -1 }
    entry.visits++
    entry.lastSeen = v.start
    if (v.snapshot && RANK[v.confidence] >= entry.best) {
      entry.snapshot = v.snapshot
      entry.best = RANK[v.confidence]
    }
    byKey.set(key, entry)
  }
  return Array.from(byKey.values())
    .map(({ best, ...species }) => species)
    .sort((a, b) => b.firstSeen - a.firstSeen)
}

export function todaySummary(visits: Visit[], now: number): Today {
  const dayStart = new Date(now).setHours(0, 0, 0, 0)
  const dayEnd = dayStart + 24 * 60 * 60 * 1000
  const today = visits.filter(v => v.start >= dayStart && v.start < dayEnd)

  const species = new Set(today.map(v => keyOf(v.name)).filter(key => key !== UNIDENTIFIED_KEY))
  const perHour = new Array<number>(24).fill(0)
  for (const v of today) perHour[new Date(v.start).getHours()]++
  const most = Math.max(...perHour)

  return {
    species: species.size,
    visits: today.length,
    busiestHour: most > 0 ? perHour.indexOf(most) : null,
  }
}
