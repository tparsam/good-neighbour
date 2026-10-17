'use client'

import { useEffect, useState } from 'react'

const TOKEN_HELP =
  'The live camera is off: the Ring sign-in has run out (it lasts 30 minutes). You can still check a photo. ' +
  'To turn the live camera back on, get a new token from the Ring Developer Playground, put it in .env.local ' +
  'as RING_ACCESS_TOKEN and restart the app.'

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
