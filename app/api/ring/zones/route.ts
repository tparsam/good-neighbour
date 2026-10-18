import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { RING_TOKEN_HEADER, RING_API, visitorToken } from '@/lib/journal/ring-session'
import { findPrivacyZones, isVideoEncrypted } from '@/lib/privacy/zones'

// The camera's existing privacy zones, and whether its video is encrypted (Ring's TAKE), in which
// case apps cannot see the live view. `zones: null` means they could not be read, which the page
// reports; it must not be confused with a camera that has none (`zones: []`).
export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId')
  if (!deviceId) return NextResponse.json({ zones: null })
  try {
    const token = await getAccessToken(visitorToken(request.headers.get(RING_TOKEN_HEADER)))
    const res = await fetch(`${RING_API}/v1/devices/${encodeURIComponent(deviceId)}/configurations`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ zones: null })
    const reply = await res.json()
    return NextResponse.json({ zones: findPrivacyZones(reply), encrypted: isVideoEncrypted(reply) })
  } catch {
    return NextResponse.json({ zones: null })
  }
}
