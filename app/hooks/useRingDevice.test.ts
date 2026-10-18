import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RING_TOKEN_HEADER } from '../../lib/journal/ring-session.ts'
import { explain, ringHeaders } from './useRingDevice.ts'

test('a refused sign-in from the app’s own token says how to renew it in .env.local', () => {
  assert.match(explain('Device discovery failed: 401 - Unauthorized'), /RING_ACCESS_TOKEN/)
})

test('a refused token the visitor pasted asks for a new one to paste, not for .env.local', () => {
  const message = explain('Device discovery failed: 401 - Unauthorized', true)
  assert.match(message, /paste a new one/)
  assert.doesNotMatch(message, /\.env\.local/)
})

test('other errors pass through unchanged', () => {
  assert.equal(explain('WHEP failed: 500 - boom', true), 'WHEP failed: 500 - boom')
})

test('a pasted token is sent in the header the Ring routes read, and no token sends nothing', () => {
  assert.deepEqual(ringHeaders('abc'), { [RING_TOKEN_HEADER]: 'abc' })
  assert.deepEqual(ringHeaders(undefined), {})
})
