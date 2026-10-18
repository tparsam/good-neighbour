import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ringSessionUrl, visitorToken } from './ring-session.ts'

test('a Ring session URL is accepted', () => {
  const url = ringSessionUrl('https://api.amazonvision.com/v1/devices/d1/media/streaming/whep/sessions/s1')
  assert.equal(url?.href, 'https://api.amazonvision.com/v1/devices/d1/media/streaming/whep/sessions/s1')
})

test('a relative session path is resolved against the Ring API', () => {
  assert.equal(ringSessionUrl('/v1/devices/d1/sessions/s1')?.href, 'https://api.amazonvision.com/v1/devices/d1/sessions/s1')
})

test('any other address is refused, so the Ring token is never sent elsewhere', () => {
  for (const bad of [
    'http://attacker.example/',
    'https://api.amazonvision.com.attacker.example/x',
    'http://api.amazonvision.com/v1/x',
    'https://user@attacker.example/',
    'javascript:alert(1)',
    '',
    null,
    42,
  ]) {
    assert.equal(ringSessionUrl(bad), null, String(bad))
  }
})

test('a token pasted by the visitor is used as sent, without spaces or a Bearer prefix', () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyaW5nIn0.c2lnbmF0dXJl'
  assert.equal(visitorToken(token), token)
  assert.equal(visitorToken(`  Bearer ${token}\n`), token)
})

test('no pasted token means the app falls back to its own sign-in', () => {
  assert.equal(visitorToken(null), null)
  assert.equal(visitorToken(''), null)
  assert.equal(visitorToken('   '), null)
})

test('something that cannot be a token is refused before it is sent to Ring', () => {
  for (const bad of ['short', 'has a space in the middle of it', 'line\r\nbreak-0123456789abcdef', 'x'.repeat(5000), 'é'.repeat(30)]) {
    assert.throws(() => visitorToken(bad), /not a Ring access token/, bad.slice(0, 20))
  }
})
