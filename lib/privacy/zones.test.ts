import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPrivacyZones, isVideoEncrypted } from './zones.ts'

const zone = [{ x: 0, y: 0.2 }, { x: 0.5, y: 0.2 }, { x: 0.5, y: 0.6 }, { x: 0, y: 0.6 }]

test('reads privacy zones wherever they sit in the reply', () => {
  assert.deepEqual(findPrivacyZones({ privacy_zones: [{ id: 'a', vertices: zone }] }), [zone])
  assert.deepEqual(findPrivacyZones({ data: { attributes: { privacy_zones: [{ id: 'a', vertices: zone }] } } }), [zone])
  assert.deepEqual(findPrivacyZones({ data: [{ attributes: { components: [{ privacy_zones: [{ vertices: zone }] }] } }] }), [zone])
})

test('motion zones are not privacy zones', () => {
  assert.deepEqual(findPrivacyZones({ motion_zones: [{ id: 'm', vertices: zone }], privacy_zones: [] }), [])
})

test('zones from several camera modules are all returned', () => {
  const reply = { a: { privacy_zones: [{ vertices: zone }] }, b: { privacy_zones: [{ vertices: zone }] } }
  assert.equal(findPrivacyZones(reply).length, 2)
})

test('a zone that is not a usable outline is left out', () => {
  const reply = {
    privacy_zones: [
      { vertices: zone },
      { vertices: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      { vertices: [{ x: 0, y: 0 }, { x: 'a', y: 1 }, { x: 1, y: 1 }] },
      { vertices: 'none' },
      null,
    ],
  }
  assert.deepEqual(findPrivacyZones(reply), [zone])
})

test('corner values outside the picture are pulled back to its edge', () => {
  const wild = [{ x: -0.2, y: 0 }, { x: 1.4, y: 0 }, { x: 1.4, y: 2 }]
  assert.deepEqual(findPrivacyZones({ privacy_zones: [{ vertices: wild }] }), [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]])
})

test('a reply with no zones gives an empty list', () => {
  for (const reply of [null, undefined, {}, { privacy_zones: [] }, { privacy_zones: 'none' }, 'text', 42]) {
    assert.deepEqual(findPrivacyZones(reply), [])
  }
})

// Ring's FAQ: device configurations carry an `e2e_encryption` object, and `e2e_encryption.enabled`
// is true when the device is encrypted (TAKE), in which case apps cannot see its video.
test('a camera whose configuration says e2e_encryption.enabled is true has encrypted video', () => {
  assert.equal(isVideoEncrypted({ e2e_encryption: { enabled: true } }), true)
  assert.equal(isVideoEncrypted({ data: { configurations: { e2e_encryption: { enabled: true } } } }), true)
})

test('a camera without encryption, or with an unclear flag, is not reported as encrypted', () => {
  for (const reply of [null, {}, { e2e_encryption: { enabled: false } }, { e2e_encryption: {} },
    { e2e_encryption: { enabled: 'true' } }, { e2e_encryption: true }, 'text']) {
    assert.equal(isVideoEncrypted(reply), false)
  }
})

// The path DoorLedger (another Ring-track app) documents for real replies.
test('reads zones from configurations.image_enhancements.privacy_zones', () => {
  const reply = { configurations: { image_enhancements: { privacy_zones: [{ vertices: zone }] }, e2e_encryption: { enabled: false } } }
  assert.deepEqual(findPrivacyZones(reply), [zone])
  assert.equal(isVideoEncrypted(reply), false)
})
