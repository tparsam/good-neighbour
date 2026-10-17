import { test } from 'node:test'
import assert from 'node:assert/strict'
import { visitorLimit } from './limit.ts'

test('a visitor gets the allowed number of checks per window, then is refused', () => {
  const allow = visitorLimit(3, 60_000)
  assert.deepEqual([1, 2, 3, 4].map(() => allow('1.2.3.4', 0)), [true, true, true, false])
})

test('visitors are counted separately', () => {
  const allow = visitorLimit(1, 60_000)
  assert.equal(allow('a', 0), true)
  assert.equal(allow('b', 0), true)
  assert.equal(allow('a', 0), false)
})

test('the count starts again once the window has passed', () => {
  const allow = visitorLimit(1, 60_000)
  assert.equal(allow('a', 0), true)
  assert.equal(allow('a', 59_999), false)
  assert.equal(allow('a', 60_000), true)
})
