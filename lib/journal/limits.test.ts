import { test } from 'node:test'
import assert from 'node:assert/strict'
import { frameCap } from './limits.ts'

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
