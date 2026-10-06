import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { appendVisit, readVisits } from '@/lib/journal/store'

const body = z
  .object({
    name: z.string().trim().min(1).max(60),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    confidence: z.enum(['high', 'medium', 'low']),
    image: z.string().regex(/^[A-Za-z0-9+/=]+$/).max(2_000_000).optional(),
  })
  .refine(v => v.end >= v.start, 'end is before start')

const failed = (error: unknown) => {
  console.error('Journal error:', error)
  return NextResponse.json({ error: 'The bird journal file could not be read or saved.' }, { status: 500 })
}

export async function GET() {
  try {
    return NextResponse.json({ visits: await readVisits() })
  } catch (error) {
    return failed(error)
  }
}

export async function POST(request: NextRequest) {
  let parsed
  try {
    parsed = body.safeParse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }
  if (!parsed.success) return NextResponse.json({ error: 'Not a valid visit' }, { status: 400 })
  try {
    const { image, ...visit } = parsed.data
    return NextResponse.json({ visit: await appendVisit(visit, image) })
  } catch (error) {
    return failed(error)
  }
}
