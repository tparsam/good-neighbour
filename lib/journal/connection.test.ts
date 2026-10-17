import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watchConnection } from './connection.ts'

// Stands in for RTCPeerConnection: just a state and a change handler.
function fakeConnection() {
  const pc = { connectionState: 'new', onconnectionstatechange: null as null | (() => void) }
  const set = (state: string) => {
    pc.connectionState = state
    pc.onconnectionstatechange?.()
  }
  return { pc, set }
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

test('a failed connection ends the stream at once', () => {
  const { pc, set } = fakeConnection()
  let ended = 0
  watchConnection(pc, () => ended++, 50)
  set('failed')
  assert.equal(ended, 1)
})

test('a brief disconnect that recovers does not end the stream', async () => {
  const { pc, set } = fakeConnection()
  let ended = 0
  watchConnection(pc, () => ended++, 50)
  set('disconnected')
  await wait(20)
  set('connected')
  await wait(60)
  assert.equal(ended, 0)
})

test('a disconnect that lasts past the grace period ends the stream once', async () => {
  const { pc, set } = fakeConnection()
  let ended = 0
  watchConnection(pc, () => ended++, 50)
  set('disconnected')
  await wait(80)
  set('failed')
  assert.equal(ended, 1)
})
