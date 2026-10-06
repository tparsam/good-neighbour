import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { EndedVisit, Visit } from './types.ts'

// ponytail: one JSON file rewritten on each save. Fine for a few thousand visits on one
// laptop; move to SQLite if the journal grows or more than one process writes to it.

export const dataDir = () => process.env.JOURNAL_DIR ?? path.join(process.cwd(), 'data')

export const isSnapshotName = (name: string) => /^[0-9]+-[a-z0-9]+\.jpg$/.test(name)

export async function readVisits(dir = dataDir()): Promise<Visit[]> {
  let text: string
  try {
    text = await fs.readFile(path.join(dir, 'visits.json'), 'utf8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
  const visits = JSON.parse(text)
  if (!Array.isArray(visits)) throw new Error('visits.json is not a list')
  return visits
}

// Saves run one after another so two visits ending together cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve()

export function appendVisit(visit: EndedVisit, jpegBase64?: string, dir = dataDir()): Promise<Visit> {
  const run = queue.then(async () => {
    const visits = await readVisits(dir)
    const id = `${visit.start}-${Math.random().toString(36).slice(2, 10)}`
    const saved: Visit = { ...visit, id }
    await fs.mkdir(path.join(dir, 'snapshots'), { recursive: true })
    if (jpegBase64) {
      saved.snapshot = `${id}.jpg`
      await fs.writeFile(path.join(dir, 'snapshots', saved.snapshot), Buffer.from(jpegBase64, 'base64'))
    }
    // Write to a temporary file and rename, so a crash cannot leave half a journal.
    const file = path.join(dir, 'visits.json')
    await fs.writeFile(`${file}.tmp`, JSON.stringify([...visits, saved], null, 2))
    await fs.rename(`${file}.tmp`, file)
    return saved
  })
  queue = run.catch(() => {})
  return run
}
