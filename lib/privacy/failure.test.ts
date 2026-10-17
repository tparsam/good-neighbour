import { test } from 'node:test'
import assert from 'node:assert/strict'
import { describeFailure } from './failure.ts'

const connectTimeout = Object.assign(new TypeError('fetch failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } })

test('a connection that could not be made says the internet is slow', () => {
  const { status, error } = describeFailure(connectTimeout)
  assert.equal(status, 504)
  assert.match(error, /internet connection/i)
  assert.match(error, /try again/i)
})

test('a check that ran out of time says so', () => {
  const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' })
  assert.equal(describeFailure(timeout).status, 504)
  assert.match(describeFailure(timeout).error, /took too long/i)
})

test('a refused key points at the key and the account', () => {
  const { status, error } = describeFailure(new Error('Bedrock returned 403: {"message":"..."}'))
  assert.equal(status, 502)
  assert.match(error, /AWS_BEARER_TOKEN_BEDROCK/)
})

test('being asked to slow down says to wait', () => {
  assert.match(describeFailure(new Error('Bedrock returned 429: Too many requests')).error, /wait/i)
})

test('anything else is a plain failure with a retry hint', () => {
  const { status, error } = describeFailure(new Error('something odd'))
  assert.equal(status, 502)
  assert.match(error, /try again/i)
})
