'use client'

import { useEffect, useState } from 'react'

const TOKEN_HELP =
  'Your Ring token is missing or has run out. Tokens last 30 minutes. Open the Ring Developer Playground, ' +
  'press Generate token, paste it into .env.local as RING_ACCESS_TOKEN, then restart the app.'

/** Turns a token or sign-in failure into steps the owner can follow; other errors pass through. */
export const explain = (error: string) => (/\b40[13]\b|not configured/i.test(error) ? TOKEN_HELP : error)

/** Finds the first Ring camera on the account. */
export function useRingDevice() {
  const [deviceId, setDeviceId] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  // True when this copy of the app has no Ring account set up at all (a public demo).
  const [notConfigured, setNotConfigured] = useState(false)

  useEffect(() => {
    fetch('/api/ring/devices')
      .then(res => res.json())
      .then(data => {
        if (data.devices?.length) setDeviceId(data.devices[0].id)
        else if (data.notConfigured) setNotConfigured(true)
        else setError(explain(data.error || 'No Ring camera was found on this account.'))
      })
      .catch(err => setError(err.message))
  }, [])

  return { deviceId, error, notConfigured }
}
