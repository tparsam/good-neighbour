import { NextRequest, NextResponse } from 'next/server'
import { frameCap } from '@/lib/journal/limits'
import { findRegions } from '@/lib/privacy/bedrock'
import { describeFailure } from '@/lib/privacy/failure'

const MAX_CHECKS = frameCap(process.env.MAX_FRAMES_PER_RUN)
const MAX_IMAGE_CHARS = 2_000_000

// Counts pictures sent to Bedrock since the server started. This is the hard cost stop.
let checksUsed = 0

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const image = body?.image
  if (typeof image !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(image) || image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: 'image must be a base64 JPEG under 1.5 MB' }, { status: 400 })
  }
  if (!process.env.AWS_BEARER_TOKEN_BEDROCK) {
    return NextResponse.json(
      { error: 'Bedrock key missing. Add AWS_BEARER_TOKEN_BEDROCK to .env.local and restart.' },
      { status: 503 }
    )
  }
  if (checksUsed >= MAX_CHECKS) {
    return NextResponse.json(
      { error: `Limit of ${MAX_CHECKS} checks reached for this run. Restart the app to continue.` },
      { status: 429 }
    )
  }

  checksUsed++
  try {
    return NextResponse.json({ regions: await findRegions(image) })
  } catch (error) {
    console.error('Privacy check error:', error)
    const { status, error: message } = describeFailure(error)
    return NextResponse.json({ error: message }, { status })
  }
}
