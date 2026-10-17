'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebRTCStream } from './hooks/useWebRTCStream'
import { useBirdWatcher } from './hooks/useBirdWatcher'
import { explain, useRingDevice } from './hooks/useRingDevice'
import { LifeList } from './components/LifeList'
import { TodaySummary } from './components/TodaySummary'
import { lifeList, todaySummary } from '@/lib/journal/summary'
import type { Visit } from '@/lib/journal/types'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const { deviceId, error: setupError } = useRingDevice()
  const [region, setRegion] = useState<string>()
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
    if (!deviceId) return
    fetch(`/api/ring/location?deviceId=${encodeURIComponent(deviceId)}`)
      .then(res => res.json())
      .then(data => setRegion(data.region ?? undefined))
      .catch(() => {})
  }, [deviceId])

  const { streamActive, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })
  const status = useBirdWatcher({ video, enabled: streamActive, region, onVisitSaved: loadVisits })

  // The date is set after mount because the server and the browser may format it differently.
  const [dateText, setDateText] = useState('')
  useEffect(() => {
    setDateText(new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  const problem = setupError || (streamError && explain(streamError)) || journalError
  const birdPresent = status.current.length > 0
  const reason = status.reason ?? 'Camera offline'
  // A short reason fits on the curved caption; a long one stays in plain type below it.
  const arcReason = reason.length <= 70

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="masthead-title">
          Ring Bird <em>Journal</em>
        </h1>
        <p className="masthead-date">{dateText}</p>
      </header>

      <nav className="section-nav" aria-label="Sections">
        <a href="#live">Live</a>
        <a href="#today">Today</a>
        <a href="#life-list">Life list</a>
      </nav>

      <section id="live" aria-labelledby="live-heading" className="section live" data-live={streamActive}>
        <div className="section-head">
          <h2 id="live-heading">Live</h2>
        </div>

        <div className="live-stage">
          <div className="live-frame">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera view" />
            {!streamActive && <p className="live-idle">The camera view appears here once the live stream starts.</p>}
          </div>
          {/* The title arches over the oval frame and the state runs under it.
              Decorative copies only; the real heading and status are the h1 and role="status" elements. */}
          <svg className="arc" viewBox="0 0 1600 900" aria-hidden="true">
            <path id="arc-top" d="M -44 450 A 844 494 0 0 1 1644 450" fill="none" />
            <path id="arc-bottom" d="M -64 450 A 864 514 0 0 0 1664 450" fill="none" />
            <text className="arc-title">
              <textPath href="#arc-top" startOffset="50%" textAnchor="middle">
                Ring Bird Journal
              </textPath>
            </text>
            <text className="arc-caption">
              <textPath href="#arc-bottom" startOffset="50%" textAnchor="middle">
                {status.watching
                  ? birdPresent
                    ? `Watching. At the feeder now: ${status.current.join(', ')}`
                    : 'Watching. No bird at the feeder.'
                  : arcReason
                    ? `Not watching: ${reason}`
                    : 'Not watching'}
              </textPath>
            </text>
          </svg>
        </div>

        <div className="live-panel">
          {/* Read aloud this is one sentence: "Not watching: Camera offline". On screen the state is large and the reason sits under it. */}
          <p role="status" className="state">
            <span className="state-line">
              {/* Filled when watching, hollow when not. The words carry the meaning; the mark only echoes them. */}
              <span className="state-mark" data-on={status.watching} aria-hidden="true" />
              {status.watching ? 'Watching' : 'Not watching'}
            </span>
            {!status.watching && (
              <span className={arcReason ? 'state-reason in-arc' : 'state-reason'}>
                <span className="sr-only">: </span>
                {reason}
              </span>
            )}
          </p>
          {status.watching && status.reason && (
            <p role="alert" className="note">
              {status.reason}
            </p>
          )}
          <p aria-live="polite" className="bird" data-present={birdPresent}>
            {birdPresent ? (
              <>
                <span className="bird-label">At the feeder now: </span>
                <span className="bird-name">{status.current.join(', ')}</span>
              </>
            ) : (
              'No bird at the feeder.'
            )}
          </p>
          <button className="btn" onClick={streamActive ? stopStream : startStream} disabled={!deviceId}>
            {streamActive ? 'Stop' : 'Start live stream'}
          </button>
        </div>

        {problem && (
          <p role="alert" className="note live-note">
            {problem}
          </p>
        )}

        <a className="chevron" href="#today" aria-label="Go to Today">
          <svg viewBox="0 0 84 26" aria-hidden="true">
            <path d="M1 1l41 23L83 1" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </a>
      </section>

      <TodaySummary today={todaySummary(visits, Date.now())} />

      <svg className="flourish" viewBox="0 0 320 280" aria-hidden="true">
        <path
          d="M318 2C250 22 230 70 222 140c-8 70-40 120-110 132-40 6-66-18-64-44 2-22 26-28 34-8 8 22-18 48-78 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <LifeList species={lifeList(visits)} />
    </main>
  )
}
