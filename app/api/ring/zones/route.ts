import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { RING_API } from '@/lib/journal/ring-session'
import { findPrivacyZones } from '@/lib/privacy/zones'

// The camera's existing privacy zones. `zones: null` means they could not be read, which the
// page reports; it must not be confused with a camera that has none (`zones: []`).
export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId')
  if (!deviceId) return NextResponse.json({ zones: null })
  try {
    const token = await getAccessToken()
    const res = await fetch(`${RING_API}/v1/devices/${encodeURIComponent(deviceId)}/configurations`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return NextResponse.json({ zones: null })
    return NextResponse.json({ zones: findPrivacyZones(await res.json()) })
  } catch {
    return NextResponse.json({ zones: null })
  }
}
