import { NextRequest, NextResponse } from 'next/server'
import { identifyBirds } from '@/lib/journal/bedrock'

const MAX_FRAMES = Number(process.env.MAX_FRAMES_PER_RUN ?? 2000)
const MAX_IMAGE_CHARS = 2_000_000

// Counts frames sent to Bedrock since the server started. This is the hard cost stop.
let framesUsed = 0

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
  if (framesUsed >= MAX_FRAMES) {
    return NextResponse.json(
      { error: `Frame limit of ${MAX_FRAMES} reached for this run. Restart the app to continue.` },
      { status: 429 }
    )
  }

  framesUsed++
  try {
    const observation = await identifyBirds(image, body.region)
    return NextResponse.json({ observation })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'The bird identification service failed.' }, { status: 502 })
  }
}
