import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'
import { RING_TOKEN_HEADER, visitorToken } from '@/lib/ring/ring-session'

const DEVICE_ID = process.env.NEXT_PUBLIC_RING_DEVICE_ID
const DEVICE_NAME = process.env.NEXT_PUBLIC_RING_DEVICE_NAME || 'Camera'
const API_BASE = 'https://api.amazonvision.com'

export async function GET(request: NextRequest) {
  try {
    const visitor = visitorToken(request.headers.get(RING_TOKEN_HEADER))
    // A copy with no Ring credentials (such as a public demo) has no camera until the visitor
    // pastes a token: said plainly, not as a failure.
    if (!visitor && !process.env.RING_ACCESS_TOKEN && !process.env.RING_REFRESH_TOKEN) {
      return NextResponse.json({ devices: [], notConfigured: true })
    }
    const token = await getAccessToken(visitor)

    // In access token mode, always auto-discover (ignore NEXT_PUBLIC_RING_DEVICE_ID)
    const isAccessTokenMode = !!visitor || !!process.env.RING_ACCESS_TOKEN
    const useConfiguredDevice = DEVICE_ID && !isAccessTokenMode

    // If device ID is configured (refresh token mode only), use it directly
    if (useConfiguredDevice) {
      const statusRes = await fetch(`${API_BASE}/v1/devices/${DEVICE_ID}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      let online = false
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        online = statusData?.data?.attributes?.online || false
      }

      return NextResponse.json({
        devices: [{
          id: DEVICE_ID,
          name: DEVICE_NAME,
          online,
          capabilities: { motionDetection: true },
        }],
      })
    }

    // Auto-discover devices using the token
    const res = await fetch(`${API_BASE}/v1/devices`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const error = await res.text()
      return NextResponse.json(
        { devices: [], error: `Device discovery failed: ${res.status} - ${error}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Normalize JSON:API response to simple device list
    const devices = (data?.data || []).map((device: any) => ({
      id: device.id,
      name: device.attributes?.name || device.attributes?.description || 'Ring Device',
      online: device.attributes?.online || false,
      capabilities: device.attributes?.capabilities || {},
    }))

    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Devices error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch devices', devices: [] },
      { status: error instanceof Error && error.message.startsWith('That is not a Ring access token') ? 400 : 500 }
    )
  }
}
