'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebRTCStream } from './hooks/useWebRTCStream'
import { useBirdWatcher } from './hooks/useBirdWatcher'
import { LifeList } from './components/LifeList'
import { TodaySummary } from './components/TodaySummary'
import { lifeList, todaySummary } from '@/lib/journal/summary'
import type { Visit } from '@/lib/journal/types'

const TOKEN_HELP =
  'Your Ring token is missing or has run out. Tokens last 30 minutes. Open the Ring Developer Playground, ' +
  'press Generate token, paste it into .env.local as RING_ACCESS_TOKEN, then restart the app.'

const explain = (error: string) => (/\b40[13]\b|not configured/i.test(error) ? TOKEN_HELP : error)

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [deviceId, setDeviceId] = useState<string>()
  const [region, setRegion] = useState<string>()
  const [setupError, setSetupError] = useState<string | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [journalError, setJournalError] = useState<string | null>(null)

  useEffect(() => setVideo(videoRef.current), [])

  const loadVisits = useCallback(async () => {
    try {
      const res = await fetch('/api/visits')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVisits(data.visits)
      setJournalError(null)
    } catch (error) {
      setJournalError(error instanceof Error ? error.message : 'The bird journal could not be loaded.')
    }
  }, [])

  useEffect(() => {
    void loadVisits()
  }, [loadVisits])

  useEffect(() => {
    fetch('/api/ring/devices')
      .then(res => res.json())
      .then(data => {
        if (data.devices?.length) setDeviceId(data.devices[0].id)
        else setSetupError(explain(data.error || 'No Ring camera was found on this account.'))
      })
      .catch(error => setSetupError(error.message))
  }, [])

  useEffect(() => {
    if (!deviceId) return
    fetch(`/api/ring/location?deviceId=${encodeURIComponent(deviceId)}`)
      .then(res => res.json())
      .then(data => setRegion(data.region ?? undefined))
      .catch(() => {})
  }, [deviceId])

  const { streamActive, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })
  const status = useBirdWatcher({ video, enabled: streamActive, region, onVisitSaved: loadVisits })

  const problem = setupError || (streamError && explain(streamError)) || journalError
  const statusText = status.watching ? 'Watching' : `Not watching: ${status.reason ?? 'Camera offline'}`

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1>Ring Bird Journal</h1>

      <section aria-labelledby="live-heading">
        <h2 id="live-heading">Live</h2>
        <video ref={videoRef} autoPlay playsInline muted className="w-full bg-black" aria-label="Live camera view" />
        <p>
          <button onClick={streamActive ? stopStream : startStream} disabled={!deviceId}>
            {streamActive ? 'Stop' : 'Start live stream'}
          </button>
        </p>
        <p role="status">{statusText}</p>
        {status.watching && status.reason && <p role="alert">{status.reason}</p>}
        <p aria-live="polite">
          {status.current.length > 0 ? `At the feeder now: ${status.current.join(', ')}` : 'No bird at the feeder.'}
        </p>
        {problem && <p role="alert">{problem}</p>}
      </section>

      <TodaySummary today={todaySummary(visits, Date.now())} />
      <LifeList species={lifeList(visits)} />
    </main>
  )
}
