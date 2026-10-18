import { test } from 'node:test'
import assert from 'node:assert/strict'
import { headlineError, matches, wilson } from './score.ts'

const box = (x1: number, y1: number, x2: number, y2: number) => ({ x1, y1, x2, y2 })

test('a found box of the right kind that covers 30% of the expected area matches', () => {
  assert.equal(matches({ kind: 'road', box: box(0, 0.5, 0.4, 1) }, { kind: 'road', box: box(0, 0.5, 1, 1) }), true)
})

test('a found box whose centre lies in the expected area matches, even if small', () => {
  assert.equal(matches({ kind: 'vehicle', box: box(0.45, 0.45, 0.55, 0.55) }, { kind: 'vehicle', box: box(0, 0, 1, 1) }), true)
})

test('the wrong kind, or a box elsewhere, does not match', () => {
  assert.equal(matches({ kind: 'road', box: box(0, 0, 1, 1) }, { kind: 'neighbour', box: box(0.2, 0.2, 0.8, 0.8) }), false)
  assert.equal(matches({ kind: 'road', box: box(0, 0, 0.1, 0.1) }, { kind: 'road', box: box(0.5, 0.5, 1, 1) }), false)
})

test('the 95% range around a share follows the Wilson score interval', () => {
  const [low, high] = wilson(81, 100)
  assert.ok(Math.abs(low - 0.7222) < 0.0005 && Math.abs(high - 0.8749) < 0.0005, `${low} ${high}`)
  assert.deepEqual(wilson(0, 0), [0, 1])
  const [l0, h0] = wilson(0, 14)
  assert.equal(l0, 0)
  assert.ok(Math.abs(h0 - 0.2153) < 0.001, `${h0}`)
})

test('the headline error is how far the share "not yours" is from the labelled share', () => {
  const road = { kind: 'road' as const, box: box(0, 0.5, 1, 1) }
  assert.equal(headlineError([road], [road]), 0)
  // The model marks half the frame; the labels say a quarter.
  assert.ok(Math.abs(headlineError([road], [{ kind: 'road', box: box(0, 0.75, 1, 1) }]) - 0.25) < 0.011)
  // Marks on a scene with nothing to find count in full.
  assert.ok(Math.abs(headlineError([{ kind: 'neighbour', box: box(0, 0, 0.1, 0.1) }], []) - 0.01) < 0.003)
})

test('the headline error ignores kinds: a house called a road still hides the same share', () => {
  assert.equal(headlineError([{ kind: 'road', box: box(0, 0, 0.5, 1) }], [{ kind: 'neighbour', box: box(0, 0, 0.5, 1) }]), 0)
})
