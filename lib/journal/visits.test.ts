import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emptyState, flush, nextState, UNIDENTIFIED, type VisitState } from './visits.ts'
import type { Confidence, Observation } from './types.ts'

const obs = (...names: string[]): Observation => ({
  birds: names.map(name => ({ name, confidence: 'high' as Confidence })),
})
const NONE = obs()

function run(steps: Array<[Observation, number, boolean?]>) {
  let state: VisitState = emptyState
  const started: string[] = []
  const ended = []
  for (const [o, now, fresh] of steps) {
    const r = nextState(state, o, now, fresh ?? true)
    state = r.state
    started.push(...r.started)
    ended.push(...r.ended)
  }
  return { state, started, ended }
}

test('one sighting does not start a visit', () => {
  const r = run([[obs('Blue Jay'), 0]])
  assert.deepEqual(r.started, [])
})

test('two consecutive sightings start a visit', () => {
  const r = run([[obs('Blue Jay'), 0], [obs('Blue Jay'), 2000]])
  assert.deepEqual(r.started, ['Blue Jay'])
})

test('a broken streak starts again from one', () => {
  const r = run([[obs('Blue Jay'), 0], [NONE, 2000], [obs('Blue Jay'), 4000]])
  assert.deepEqual(r.started, [])
})

test('a visit ends 10 seconds after the bird was last seen', () => {
  const r = run([
    [obs('Blue Jay'), 0], [obs('Blue Jay'), 2000], [obs('Blue Jay'), 4000],
    [NONE, 6000], [NONE, 13999], [NONE, 14000],
  ])
  assert.deepEqual(r.ended, [{ name: 'Blue Jay', start: 0, end: 4000, confidence: 'high' }])
  assert.deepEqual(r.state.tracked, [])
})

test('a bird that keeps being seen is one visit', () => {
  const steps: Array<[Observation, number]> = []
  for (let t = 0; t <= 60000; t += 2000) steps.push([obs('Blue Jay'), t])
  const r = run(steps)
  assert.deepEqual(r.started, ['Blue Jay'])
  assert.deepEqual(r.ended, [])
})

test('low confidence is recorded as an unidentified bird', () => {
  const low: Observation = { birds: [{ name: 'Blue Jay', confidence: 'low' }] }
  const r = run([[low, 0], [low, 2000]])
  assert.deepEqual(r.started, [UNIDENTIFIED])
})

test('case and spacing do not split a bird into two visits', () => {
  const r = run([[obs('house finch'), 0], [obs('  House   Finch '), 2000], [obs('HOUSE FINCH'), 4000]])
  assert.deepEqual(r.started, ['house finch'])
  assert.equal(r.state.tracked.length, 1)
})

test('two birds at once are two visits', () => {
  const r = run([[obs('Blue Jay', 'Junco'), 0], [obs('Blue Jay', 'Junco'), 2000]])
  assert.deepEqual(r.started.sort(), ['Blue Jay', 'Junco'])
})

test('a still bird stays one open visit while frames are unchanged', () => {
  const r = run([
    [obs('Blue Jay'), 0], [obs('Blue Jay'), 2000],
    [obs('Blue Jay'), 20000, false], [obs('Blue Jay'), 40000, false],
  ])
  assert.deepEqual(r.ended, [])
  assert.equal(r.state.tracked[0].lastSeen, 40000)
})

test('a reused observation never confirms a visit', () => {
  const r = run([[obs('Blue Jay'), 0], [obs('Blue Jay'), 2000, false], [obs('Blue Jay'), 4000, false]])
  assert.deepEqual(r.started, [])
})

test('flush closes open visits and ignores unconfirmed ones', () => {
  const r = run([[obs('Blue Jay'), 0], [obs('Blue Jay'), 2000], [obs('Blue Jay', 'Junco'), 4000]])
  assert.deepEqual(flush(r.state), [{ name: 'Blue Jay', start: 0, end: 4000, confidence: 'high' }])
})
