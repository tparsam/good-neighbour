import type { Point, Zone } from './types.ts'

const clamp = (value: number) => Math.min(1, Math.max(0, value))

function toZone(raw: any): Zone | null {
  const vertices = raw?.vertices
  if (!Array.isArray(vertices) || vertices.length < 3) return null
  const zone: Point[] = []
  for (const v of vertices) {
    if (typeof v?.x !== 'number' || typeof v?.y !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null
    zone.push({ x: clamp(v.x), y: clamp(v.y) })
  }
  return zone
}

/** Every privacy zone in a Ring device-configurations reply. Ring's guide shows the field
 *  name (`privacy_zones`, each with `vertices` from 0 to 1) but not where it sits in the
 *  reply, so the whole reply is searched for it. Unusable zones are left out. */
export function findPrivacyZones(reply: unknown, depth = 0): Zone[] {
  // ponytail: a depth limit instead of cycle detection; JSON from an API has no cycles.
  if (reply === null || typeof reply !== 'object' || depth > 8) return []
  const zones: Zone[] = []
  for (const [key, value] of Object.entries(reply)) {
    if (key === 'privacy_zones') {
      if (Array.isArray(value)) for (const raw of value) { const zone = toZone(raw); if (zone) zones.push(zone) }
    } else {
      zones.push(...findPrivacyZones(value, depth + 1))
    }
  }
  return zones
}

/** Whether a Ring device-configurations reply says the camera's video is encrypted (Ring's TAKE).
 *  Apps then get only encrypted video, so the live view cannot be checked. Only an explicit
 *  `e2e_encryption.enabled === true` counts. */
export function isVideoEncrypted(reply: unknown, depth = 0): boolean {
  if (reply === null || typeof reply !== 'object' || depth > 8) return false
  return Object.entries(reply).some(([key, value]) =>
    key === 'e2e_encryption' ? (value as any)?.enabled === true : isVideoEncrypted(value, depth + 1)
  )
}
