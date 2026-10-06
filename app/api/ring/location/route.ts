import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'

const API_BASE = 'https://api.amazonvision.com'

// The region is only a hint for the AI, so every failure here is "no region", not an error.
export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get('deviceId')
  if (!deviceId) return NextResponse.json({ region: null })
  try {
    const token = await getAccessToken()
    const res = await fetch(`${API_BASE}/v1/devices/${encodeURIComponent(deviceId)}/location`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return NextResponse.json({ region: null })
    const attrs = (await res.json())?.data?.attributes ?? {}
    const region = [attrs.state, attrs.country].filter(part => typeof part === 'string' && part).join(', ')
    return NextResponse.json({ region: region || null })
  } catch {
    return NextResponse.json({ region: null })
  }
}
