'use client'

import { useEffect, useState } from 'react'

const TOKEN_HELP =
  'The live camera is off: the Ring sign-in has run out (it lasts 30 minutes). You can still check a photo. ' +
  'To turn the live camera back on, get a new token from the Ring Developer Playground, put it in .env.local ' +
  'as RING_ACCESS_TOKEN and restart the app.'

const PASTED_TOKEN_HELP =
  'The live camera is off: Ring did not accept this token (tokens from the Ring Developer Playground last ' +
  '30 minutes). Get another there and paste a new one below. You can still check a photo.'

const refused = (error: string) => /\b40[13]\b|not configured/i.test(error)

/** Turns a token or sign-in failure into steps the owner can follow; other errors pass through.
 *  `pasted` is true when the token was pasted into the page rather than set in .env.local. */
export const explain = (error: string, pasted = false) =>
  refused(error) ? (pasted ? PASTED_TOKEN_HELP : TOKEN_HELP) : error

/** The header (RING_TOKEN_HEADER in lib/ring/ring-session) that sends a pasted Ring token to this app's Ring routes. */
export const ringHeaders = (token?: string): Record<string, string> => (token ? { 'x-ring-token': token } : {})

/** Finds the first Ring camera on the account: the app's own, or the one a pasted `token` signs in to. */
export function useRingDevice(token?: string) {
  const [deviceId, setDeviceId] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  // True when this copy of the app has no Ring account set up at all (a public demo) and no token was pasted.
  const [notConfigured, setNotConfigured] = useState(false)
  // True when Ring refused the sign-in, or a pasted token could not be one, so a new token is needed.
  const [signInRefused, setSignInRefused] = useState(false)

  useEffect(() => {
    let current = true
    setDeviceId(undefined)
    setError(null)
    setNotConfigured(false)
    setSignInRefused(false)
    fetch('/api/ring/devices', { headers: ringHeaders(token) })
      .then(res => res.json())
      .then(data => {
        if (!current) return
        if (data.devices?.length) setDeviceId(data.devices[0].id)
        else if (data.notConfigured) setNotConfigured(true)
        else {
          const message = data.error || 'No Ring camera was found on this account.'
          setSignInRefused(refused(message) || message.startsWith('That is not a Ring access token'))
          setError(explain(message, !!token))
        }
      })
      .catch(err => current && setError(err.message))
    return () => {
      current = false
    }
  }, [token])

  return { deviceId, error, notConfigured, signInRefused }
}
