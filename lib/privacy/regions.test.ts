import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseRegions } from './regions.ts'

const reply = (regions: unknown) => JSON.stringify({ regions })

test('reads boxes and scales them from 0-1000 to 0-1', () => {
  assert.deepEqual(parseRegions(reply([{ kind: 'road', box: [0, 600, 1000, 1000] }])), [
    { kind: 'road', box: { x1: 0, y1: 0.6, x2: 1, y2: 1 } },
  ])
})

test('reads JSON inside a code fence or a sentence', () => {
  const text = 'Here are the regions:\n```json\n' + reply([{ kind: 'vehicle', box: [100, 200, 300, 400] }]) + '\n```'
  assert.deepEqual(parseRegions(text), [{ kind: 'vehicle', box: { x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4 } }])
})

test('corners given in the wrong order are put right', () => {
  assert.deepEqual(parseRegions(reply([{ kind: 'road', box: [500, 900, 100, 300] }])), [
    { kind: 'road', box: { x1: 0.1, y1: 0.3, x2: 0.5, y2: 0.9 } },
  ])
})

test('values outside the picture are pulled back to its edge', () => {
  assert.deepEqual(parseRegions(reply([{ kind: 'road', box: [-50, 0, 1200, 500] }])), [
    { kind: 'road', box: { x1: 0, y1: 0, x2: 1, y2: 0.5 } },
  ])
})

test('the US spelling of neighbour is accepted', () => {
  assert.equal(parseRegions(reply([{ kind: 'Neighbor', box: [0, 0, 500, 500] }]))?.[0].kind, 'neighbour')
})

test('one bad region is skipped without losing the good ones', () => {
  const regions = parseRegions(
    reply([
      { kind: 'road', box: [0, 0, 500, 500] },
      { kind: 'sky', box: [0, 0, 500, 500] },
      { kind: 'road', box: [0, 0, 500] },
      { kind: 'road', box: [200, 200, 200, 800] },
      { kind: 'road', box: ['a', 0, 1, 1] },
      null,
    ])
  )
  assert.deepEqual(regions, [{ kind: 'road', box: { x1: 0, y1: 0, x2: 0.5, y2: 0.5 } }])
})

test('an empty list means nothing was found', () => {
  assert.deepEqual(parseRegions('{"regions":[]}'), [])
})

for (const [label, text] of [
  ['empty text', ''],
  ['not JSON', 'The road is at the bottom.'],
  ['broken JSON', '{"regions":[{"kind":"road"'],
  ['no regions list', '{"boxes":[]}'],
  ['regions is not a list', '{"regions":"road"}'],
] as const) {
  test(`returns null for ${label}`, () => {
    assert.equal(parseRegions(text), null)
  })
}

// Seen from Nova Lite on 2026-10-17, about 1 reply in 8: valid regions inside broken JSON (an extra "]").
test('regions are still read when the reply around them is broken JSON', () => {
  const reply = '{"regions":[{"kind":"road","box":[0, 839, 1000, 999]}]]}'
  assert.deepEqual(parseRegions(reply), [{ kind: 'road', box: { x1: 0, y1: 0.839, x2: 1, y2: 0.999 } }])
})

test('broken JSON with no readable region is still no answer, not "nothing found"', () => {
  assert.equal(parseRegions('{"regions":[{"kind":"road","box":[0, 839'), null)
  assert.equal(parseRegions('{"regions":[}'), null)
})

test('broken JSON whose only regions are unusable is no answer', () => {
  assert.equal(parseRegions('{"regions":[{"kind":"tree","box":[0, 0, 10, 10]}]]}'), null)
})
