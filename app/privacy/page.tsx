'use client'

import { useEffect, useRef, useState } from 'react'
import { explain, useRingDevice } from '../hooks/useRingDevice'
import { useWebRTCStream } from '../hooks/useWebRTCStream'
import { coverage, suggestZones } from '@/lib/privacy/geometry'
import type { Region, RegionKind, Zone } from '@/lib/privacy/types'
import { SampleScene } from './SampleScene'
import { SAMPLE_REGIONS, SAMPLE_ZONES } from './sample'

const KIND: Record<RegionKind, { label: string; title: string }> = {
  road: { label: 'Road', title: 'The road and pavement' },
  neighbour: { label: 'Neighbour', title: 'The neighbour’s house' },
  vehicle: { label: 'Vehicle', title: 'A vehicle on the road' },
}

interface Result {
  regions: Region[]
  /** The camera's existing privacy zones, or null if they could not be read. */
  zones: Zone[] | null
  /** The frame that was checked, as a data URL. */
  image: string
  /** Its width over its height, so the survey shows the whole picture and the marks line up. */
  ratio: number
  time: string
}

const percent = (share: number) => `${Math.round(share * 100)}%`
const points = (zone: Zone, height: number) => zone.map(p => `${p.x * 1600},${p.y * height}`).join(' ')
const corners = (zone: Zone) => zone.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join('  ')
const share = (zone: Zone) => (zone[1].x - zone[0].x) * (zone[2].y - zone[1].y)

/** Draws a video frame or a photo into a JPEG at most 1024 px wide, as a data URL. */
function toJpeg(source: CanvasImageSource, width: number, height: number): Picture {
  const canvas = document.createElement('canvas')
  canvas.width = Math.min(1024, width)
  canvas.height = Math.round((canvas.width * height) / width)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  return { image: canvas.toDataURL('image/jpeg', 0.85), ratio: canvas.width / canvas.height }
}

interface Picture {
  image: string
  ratio: number
}

const readZones = (deviceId: string | undefined) =>
  fetch(`/api/ring/zones?deviceId=${encodeURIComponent(deviceId ?? '')}`)
    .then(res => res.json())
    .catch(() => ({ zones: null }))

export default function PrivacyCheck() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { deviceId, error: setupError } = useRingDevice()
  const { streamActive, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })
  const [result, setResult] = useState<Result | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [asRecorded, setAsRecorded] = useState(false)
  // Ring's TAKE encryption hides a camera's video from apps, so its live view cannot be checked.
  const [encrypted, setEncrypted] = useState(false)

  useEffect(() => {
    if (deviceId) readZones(deviceId).then(data => setEncrypted(data.encrypted === true))
  }, [deviceId])

  // Takes the frame on screen and checks it.
  function checkLive() {
    const video = videoRef.current
    if (video?.videoWidth) analyse(() => toJpeg(video, video.videoWidth, video.videoHeight))
  }

  // Checks a photo the owner chose, such as a screenshot of the camera's view in the Ring app.
  function checkPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // so choosing the same photo again checks it again
    if (!file) return
    analyse(async () => {
      if (!file.type.startsWith('image/')) throw new Error('That file is not a picture. Choose a photo or a screenshot.')
      const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error('That picture could not be opened. Try a JPEG or PNG.')
      })
      return toJpeg(bitmap, bitmap.width, bitmap.height)
    })
  }

  // Asks which parts of the picture are not the owner's, and reads the camera's own zones.
  async function analyse(picture: () => Picture | Promise<Picture>) {
    if (checking) return
    setChecking(true)
    setCheckError(null)
    try {
      const { image, ratio } = await picture()
      const [found, existing] = await Promise.all([
        fetch('/api/privacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: image.split(',')[1] }),
        }).then(async res => ({ ok: res.ok, data: await res.json() })),
        readZones(deviceId),
      ])
      if (!found.ok) throw new Error(found.data.error ?? 'The check failed.')
      // No usable answer is not the same as "nothing found", so it is reported, never shown as a clean result.
      if (!Array.isArray(found.data.regions)) throw new Error('No usable answer came back for this picture. Try again.')

      setResult({
        regions: found.data.regions,
        zones: Array.isArray(existing.zones) ? existing.zones : null,
        image,
        ratio,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      })
      setAsRecorded(false)
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : 'The check failed.')
    } finally {
      setChecking(false)
    }
  }

  // Until a real check has run, a drawn sample stands in for the camera and the model's answer.
  const isSample = result === null
  const regions = result ? result.regions : SAMPLE_REGIONS
  const zones = result ? result.zones ?? [] : SAMPLE_ZONES
  const zonesUnknown = result !== null && result.zones === null
  // The marks are drawn 1600 units wide and as tall as the picture's shape needs (the sample is 16:9).
  const height = result ? 1600 / result.ratio : 900
  const found = coverage(regions, zones)
  const suggestions = suggestZones(regions, zones)

  const summary = checking
    ? 'Checking this view'
    : `${percent(found.exposed)} of this view is not yours and is still recorded`
  const findings =
    `${percent(found.outside)} not yours, ${percent(found.hidden)} already hidden, ` +
    `${suggestions.length} ${suggestions.length === 1 ? 'zone' : 'zones'} suggested`
  const problem = setupError || (streamError && explain(streamError)) || checkError
  const picture = result ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="scene" src={result.image} alt="The camera view that was checked" />
  ) : (
    <SampleScene />
  )

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="masthead-title">Good Neighbour</h1>
        <p className="masthead-date">{isSample ? 'Sample result' : `Checked at ${result.time}`}</p>
      </header>

      <nav className="section-nav" aria-label="Sections">
        <a href="#view">The view</a>
        <a href="#findings">Findings</a>
        <a href="#zones">Zones</a>
      </nav>

      <section id="view" aria-labelledby="view-heading" className="section live">
        <div className="section-head">
          <h2 id="view-heading">The view</h2>
        </div>

        <div className="live-stage">
          <div className="live-frame">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera view" />
            {!streamActive && <div className="cover">{picture}</div>}
          </div>
          {/* The title arches over the oval and the finding runs under it. Decorative copies only;
              the real heading is the h1 and the real finding is the status paragraph below. */}
          <svg className="arc" viewBox="0 0 1600 900" aria-hidden="true">
            <path id="arc-top" d="M -44 450 A 844 494 0 0 1 1644 450" fill="none" />
            <path id="arc-bottom" d="M -64 450 A 864 514 0 0 0 1664 450" fill="none" />
            <text className="arc-title">
              <textPath href="#arc-top" startOffset="50%" textAnchor="middle">
                Good Neighbour
              </textPath>
            </text>
            <text className="arc-caption">
              <textPath href="#arc-bottom" startOffset="50%" textAnchor="middle">
                {summary}
              </textPath>
            </text>
          </svg>
        </div>

        <div className="live-panel">
          <p role="status" className="state">
            <span className="state-line">{summary}</span>
          </p>
          <div className="actions">
            <button className="btn" onClick={streamActive ? stopStream : startStream} disabled={!deviceId || encrypted}>
              {streamActive ? 'Stop' : 'Start live stream'}
            </button>
            <button className="btn" onClick={checkLive} disabled={!streamActive || checking}>
              {checking ? 'Checking' : 'Check this view'}
            </button>
            <label className="btn btn-file" data-disabled={checking}>
              Check a photo
              <input type="file" accept="image/*" onChange={checkPhoto} disabled={checking} />
            </label>
          </div>
        </div>

        {problem && (
          <p role="alert" className="note live-note">
            {problem}
          </p>
        )}
        {checking && (
          <p className="note live-note">
            Sending the picture to be checked. On a slow internet connection this can take up to a minute.
          </p>
        )}
        {encrypted && (
          <p className="note live-note">
            This camera’s video is encrypted by Ring, so apps cannot see its live view. Open the camera’s live view in
            the Ring app, take a screenshot, and press Check a photo. Your existing privacy zones are still read.
          </p>
        )}
        {isSample && (
          <p className="note live-note">
            This is a sample result on a drawn scene, not a real camera. The areas marked as not yours are made up; the
            percentages and the suggested zones are worked out from them by the app. To check your own camera, start
            the live stream and press Check this view, or press Check a photo and choose a screenshot of its view.
          </p>
        )}
        {zonesUnknown && (
          <p className="note live-note">
            The camera’s existing privacy zones could not be read, so none are shown. Some of the suggested zones may
            already be in place.
          </p>
        )}

        <a className="chevron" href="#findings" aria-label="Go to Findings">
          <svg viewBox="0 0 84 26" aria-hidden="true">
            <path d="M1 1l41 23L83 1" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </a>
      </section>

      <section id="findings" aria-labelledby="findings-heading" className="section today">
        <div className="section-head">
          <h2 id="findings-heading">Findings</h2>
        </div>
        <div className="section-body">
          {/* One sentence, set like an oversized quote, so it wraps cleanly on a phone. */}
          <p className="figures">{findings}</p>
        </div>
      </section>

      <svg className="flourish" viewBox="0 0 320 280" aria-hidden="true">
        <path
          d="M318 2C250 22 230 70 222 140c-8 70-40 120-110 132-40 6-66-18-64-44 2-22 26-28 34-8 8 22-18 48-78 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <section id="zones" aria-labelledby="zones-heading" className="section lifelist">
        <div className="section-head">
          <h2 id="zones-heading">Zones</h2>
          <p className="count">
            {suggestions.length} suggested, {zonesUnknown ? 'existing zones unknown' : `${zones.length} already set`}
          </p>
        </div>

        <div className="section-body">
          <figure className="survey">
            <div className="survey-frame" style={result ? { aspectRatio: result.ratio } : undefined}>
              {picture}
              <svg className="survey-marks" viewBox={`0 0 1600 ${height}`} aria-hidden="true">
                <defs>
                  <pattern id="hatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <path d="M0 0v18" stroke="currentColor" strokeWidth="2" />
                  </pattern>
                </defs>
                {!asRecorded &&
                  regions.map((r, i) => (
                    <g key={i}>
                      <rect
                        className="mark-region"
                        x={r.box.x1 * 1600}
                        y={r.box.y1 * height}
                        width={(r.box.x2 - r.box.x1) * 1600}
                        height={(r.box.y2 - r.box.y1) * height}
                        fill="url(#hatch)"
                      />
                      <text className="mark-label" x={r.box.x1 * 1600 + 30} y={r.box.y1 * height + 46}>
                        {KIND[r.kind].label}
                      </text>
                    </g>
                  ))}
                {suggestions.map((s, i) => (
                  <polygon key={i} className={asRecorded ? 'mark-hidden' : 'mark-suggested'} points={points(s.zone, height)} />
                ))}
                {zones.map((zone, i) => (
                  <polygon key={i} className="mark-hidden" points={points(zone, height)} />
                ))}
              </svg>
            </div>
            <figcaption className="legend">
              {asRecorded ? (
                <p>What the camera would record with the suggested zones in place. Solid areas are not recorded.</p>
              ) : (
                <ul>
                  <li>
                    <span className="key key-region" aria-hidden="true" /> Hatched: not yours
                  </li>
                  <li>
                    <span className="key key-hidden" aria-hidden="true" /> Solid: hidden by a zone you already have
                  </li>
                  <li>
                    <span className="key key-suggested" aria-hidden="true" /> Dashed outline: a suggested zone
                  </li>
                </ul>
              )}
              <button className="btn" aria-pressed={asRecorded} onClick={() => setAsRecorded(v => !v)}>
                {asRecorded ? 'Show the survey' : 'Show what would be recorded'}
              </button>
            </figcaption>
          </figure>

          {suggestions.length === 0 ? (
            <p className="empty">
              {regions.length === 0
                ? 'Nothing outside your property was found in this view.'
                : 'Nothing to suggest. Everything outside your property is already hidden.'}
            </p>
          ) : (
            <ul className="species">
              {suggestions.map((s, i) => (
                <li key={i} className="specimen">
                  <p className="meta">
                    {KIND[s.kind].label}. {percent(share(s.zone))} of the frame.
                  </p>
                  <h3>
                    Zone {i + 1}: {KIND[s.kind].title}
                  </h3>
                  <p className="coords">
                    Corners, as fractions of the picture from the top-left: <span>{corners(s.zone)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="apply">
            <h3>To apply a zone</h3>
            <ol>
              <li>Open the Ring app and choose the camera.</li>
              <li>Go to Device Settings, then Privacy Settings, then Privacy Zones.</li>
              <li>Draw a zone over the area shown here and save.</li>
            </ol>
            <p>
              These are suggestions for you to check, not verdicts. The app can recognise a road or another house, but it
              cannot know where your property ends. Ring does not let apps change zones, so you draw them yourself.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
