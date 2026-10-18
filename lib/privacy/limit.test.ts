import { test } from 'node:test'
import assert from 'node:assert/strict'
import { frameCap, visitorLimit } from './limit.ts'

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

test('the cap defaults to 2000 when nothing is set', () => {
  assert.equal(frameCap(undefined), 2000)
  assert.equal(frameCap(''), 2000)
  assert.equal(frameCap('   '), 2000)
})

test('a plain number sets the cap', () => {
  assert.equal(frameCap('500'), 500)
  assert.equal(frameCap('0'), 0)
})

test('a mistyped value falls back to the default instead of removing the cap', () => {
  for (const bad of ['2,000', '2000 frames', 'lots', '-5', 'NaN', 'Infinity']) {
    assert.equal(frameCap(bad), 2000, bad)
  }
})
