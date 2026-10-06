import type { Confidence, EndedVisit, Observation } from './types.ts'

export const CONFIRM_FRAMES = 2
export const GONE_MS = 10_000
export const UNIDENTIFIED = 'Unidentified bird'

export interface Tracked {
  key: string
  name: string
  streak: number
  open: boolean
  start: number
  lastSeen: number
  confidence: Confidence
}

export interface VisitState {
  tracked: Tracked[]
}

export const emptyState: VisitState = { tracked: [] }

const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 }
const tidy = (name: string) => name.trim().replace(/\s+/g, ' ')

export const keyOf = (name: string) => tidy(name).toLowerCase()

const toVisit = (t: Tracked): EndedVisit => ({
  name: t.name,
  start: t.start,
  end: t.lastSeen,
  confidence: t.confidence,
})

export function nextState(state: VisitState, obs: Observation, now: number, fresh = true) {
  const seen = new Map<string, { name: string; confidence: Confidence }>()
  for (const bird of obs.birds) {
    const name = bird.confidence === 'low' ? UNIDENTIFIED : tidy(bird.name)
    const key = keyOf(name)
    const prev = seen.get(key)
    if (!prev || RANK[bird.confidence] > RANK[prev.confidence]) {
      seen.set(key, { name, confidence: bird.confidence })
    }
  }

  const tracked: Tracked[] = []
  const started: string[] = []
  const ended: EndedVisit[] = []

  for (const t of state.tracked) {
    const hit = seen.get(t.key)
    if (hit) {
      seen.delete(t.key)
      const streak = fresh ? t.streak + 1 : t.streak
      const open = t.open || streak >= CONFIRM_FRAMES
      if (open && !t.open) started.push(t.name)
      const confidence = RANK[hit.confidence] > RANK[t.confidence] ? hit.confidence : t.confidence
      tracked.push({ ...t, streak, open, lastSeen: now, confidence })
    } else if (t.open) {
      if (now - t.lastSeen >= GONE_MS) ended.push(toVisit(t))
      else tracked.push(t)
    }
    // Not open and not seen: the streak is broken, so it is dropped.
  }

  if (fresh) {
    seen.forEach((hit, key) => {
      tracked.push({ key, name: hit.name, streak: 1, open: false, start: now, lastSeen: now, confidence: hit.confidence })
    })
  }

  return { state: { tracked }, started, ended }
}

export function flush(state: VisitState): EndedVisit[] {
  return state.tracked.filter(t => t.open).map(toVisit)
}
