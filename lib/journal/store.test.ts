import { test } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { appendVisit, isSnapshotName, readVisits } from './store.ts'
import type { EndedVisit } from './types.ts'

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'journal-'))
const jay: EndedVisit = { name: 'Blue Jay', start: 1000, end: 5000, confidence: 'high' }
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')

test('reading a journal that does not exist yet gives no visits', async () => {
  assert.deepEqual(await readVisits(await tmp()), [])
})

test('a saved visit can be read back', async () => {
  const dir = await tmp()
  const saved = await appendVisit(jay, undefined, dir)
  assert.match(saved.id, /^1000-[a-z0-9]+$/)
  assert.equal(saved.snapshot, undefined)
  assert.deepEqual(await readVisits(dir), [saved])
})

test('a snapshot is written beside the journal', async () => {
  const dir = await tmp()
  const saved = await appendVisit(jay, JPEG, dir)
  assert.equal(saved.snapshot, `${saved.id}.jpg`)
  assert.ok(isSnapshotName(saved.snapshot!))
  const bytes = await fs.readFile(path.join(dir, 'snapshots', saved.snapshot!))
  assert.deepEqual([...bytes], [0xff, 0xd8, 0xff, 0xd9])
})

test('visits saved at the same moment are all kept', async () => {
  const dir = await tmp()
  await Promise.all(Array.from({ length: 10 }, (_, i) => appendVisit({ ...jay, start: i }, undefined, dir)))
  assert.equal((await readVisits(dir)).length, 10)
})

test('a corrupt journal is reported and left untouched', async () => {
  const dir = await tmp()
  const file = path.join(dir, 'visits.json')
  await fs.writeFile(file, '[{"name":"Blue J')
  await assert.rejects(readVisits(dir))
  await assert.rejects(appendVisit(jay, undefined, dir))
  assert.equal(await fs.readFile(file, 'utf8'), '[{"name":"Blue J')
})

test('snapshot names cannot point outside the snapshot folder', () => {
  assert.ok(isSnapshotName('1000-ab12cd.jpg'))
  for (const bad of ['../../.env.local', '..%2F.env.local', '1000-ab/cd.jpg', '1000-ab12cd.png', '.jpg', '']) {
    assert.equal(isSnapshotName(bad), false, bad)
  }
})
