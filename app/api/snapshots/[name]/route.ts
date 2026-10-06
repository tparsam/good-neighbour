import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { dataDir, isSnapshotName } from '@/lib/journal/store'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!isSnapshotName(name)) return NextResponse.json({ error: 'Bad snapshot name' }, { status: 400 })
  try {
    const bytes = await fs.readFile(path.join(dataDir(), 'snapshots', name))
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'image/jpeg' } })
  } catch {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
  }
}
