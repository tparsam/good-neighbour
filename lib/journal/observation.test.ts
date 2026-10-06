import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseObservation } from './observation.ts'

const good = { birds: [{ name: 'Blue Jay', confidence: 'high' }] }

test('reads plain JSON', () => {
  assert.deepEqual(parseObservation(JSON.stringify(good)), good)
})

test('reads JSON inside a code fence', () => {
  assert.deepEqual(parseObservation('```json\n' + JSON.stringify(good) + '\n```'), good)
})

test('reads JSON with a sentence around it', () => {
  assert.deepEqual(parseObservation('Here you go: ' + JSON.stringify(good) + ' Hope that helps.'), good)
})

test('an empty list means no birds', () => {
  assert.deepEqual(parseObservation('{"birds":[]}'), { birds: [] })
})

test('trims the name', () => {
  assert.deepEqual(parseObservation('{"birds":[{"name":"  Junco ","confidence":"medium"}]}'), {
    birds: [{ name: 'Junco', confidence: 'medium' }],
  })
})

for (const [label, text] of [
  ['empty text', ''],
  ['not JSON', 'I can see a bird.'],
  ['broken JSON', '{"birds":[{"name":"Blue Jay"'],
  ['missing confidence', '{"birds":[{"name":"Blue Jay"}]}'],
  ['unknown confidence', '{"birds":[{"name":"Blue Jay","confidence":"certain"}]}'],
  ['empty name', '{"birds":[{"name":"","confidence":"high"}]}'],
  ['name too long', JSON.stringify({ birds: [{ name: 'x'.repeat(61), confidence: 'high' }] })],
  ['birds is not a list', '{"birds":"Blue Jay"}'],
] as const) {
  test(`returns null for ${label}`, () => {
    assert.equal(parseObservation(text), null)
  })
}
