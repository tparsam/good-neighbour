'use client'

import { useEffect, useRef, useState } from 'react'
import { explain, useRingDevice } from '../hooks/useRingDevice'
import { useWebRTCStream } from '../hooks/useWebRTCStream'
import { MAX_ZONES, coverage, suggestZones } from '@/lib/privacy/geometry'
import type { Region, RegionKind, Zone } from '@/lib/privacy/types'
import { SampleScene } from './SampleScene'
import './look.css'
import { SAMPLE_REGIONS, SAMPLE_ZONES } from './sample'

const KIND: Record<RegionKind, { label: string; title: string }> = {
  road: { label: 'Road', title: 'the road and pavement' },
  neighbour: { label: 'Neighbour', title: 'houses that are not yours' },
  vehicle: { label: 'Vehicle', title: 'vehicles' },
}

/** "a", "a and b", "a, b and c" */
const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)
const title = (kinds: RegionKind[]) => {
  const text = list(kinds.map(k => KIND[k].title))
  return text[0].toUpperCase() + text.slice(1)
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

const percent = (share: number) => (share > 0 && share < 0.005 ? 'under 1%' : `${Math.round(share * 100)}%`)
const points = (zone: Zone, height: number) => zone.map(p => `${p.x * 1600},${p.y * height}`).join(' ')
const corners = (zone: Zone) => zone.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join('  ')
/** Background settings that show only `zone` of a picture, for the zone prints. */
function crop(image: string, ratio: number, zone: Zone) {
  const [x1, y1, x2, y2] = [zone[0].x, zone[0].y, zone[1].x, zone[2].y]
  const w = x2 - x1
  const h = y2 - y1
  const at = (start: number, size: number) => (size >= 1 ? 0 : (start / (1 - size)) * 100)
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: `${100 / w}% ${100 / h}%`,
    backgroundPosition: `${at(x1, w)}% ${at(y1, h)}%`,
    aspectRatio: String((w * ratio) / h),
    // Never taller than 420px: a tall, narrow zone gets a narrow print rather than a squashed one.
    maxWidth: `${Math.round((420 * w * ratio) / h)}px`,
  }
}

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

/** Openly licensed photos anyone can try, served from public/samples (credited on the page). */
const SAMPLES = [
  { src: '/samples/ring-doorbell-frame.jpg', label: 'A Ring doorbell' },
  { src: '/samples/front-door-street-view.jpg', label: 'A front door' },
  { src: '/samples/street-from-across-the-road.jpg', label: 'Across the road' },
]

/** Opens a picture file (a photo, a screenshot or a sample) as a JPEG ready to check. */
async function fromFile(file: Blob) {
  if (!file.type.startsWith('image/')) throw new Error('That file is not a picture. Choose a photo or a screenshot.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('That picture could not be opened. Try a JPEG or PNG.')
  })
  return toJpeg(bitmap, bitmap.width, bitmap.height)
}

const readZones = (deviceId: string | undefined) =>
  fetch(`/api/ring/zones?deviceId=${encodeURIComponent(deviceId ?? '')}`)
    .then(res => res.json())
    .catch(() => ({ zones: null }))

export default function PrivacyCheck() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { deviceId, error: setupError, notConfigured } = useRingDevice()
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
    if (file) analyse(() => fromFile(file))
  }

  // Checks one of the sample photos, for anyone without a Ring camera or a photo to hand.
  function checkSample(src: string) {
    analyse(async () => fromFile(await fetch(src).then(res => res.blob())))
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
    ? 'Sending the picture to be checked. On a slow connection this can take up to a minute.'
    : `${percent(found.exposed)} of this view is not yours and is still recorded`
  // The answer in a few words, set large over the picture.
  const verdict = checking
    ? 'Checking'
    : regions.length === 0
      ? 'Nothing found'
      : found.exposed === 0
        ? 'All hidden'
        : `${percent(found.exposed)} not yours`
  // What would still be recorded with the suggested zones added to the camera's own.
  const after = coverage(regions, [...zones, ...suggestions.map(s => s.zone)])
  // Plain sentences, so "before" and "after" the suggested zones cannot be confused.
  const findings =
    regions.length === 0
      ? 'Nothing in this view looks like someone else’s.'
      : `${percent(found.outside)} of this view is not yours, and ${percent(found.hidden)} is already hidden by your zones.` +
        (suggestions.length
          ? ` With the ${suggestions.length === 1 ? 'suggested zone' : `${suggestions.length} suggested zones`} added, ${percent(after.exposed)} would still be recorded.`
          : '')
  // The camera's problem and the check's problem can both happen (a stream often ends while a
  // check is still running), so each is shown.
  // Once a photo has been checked, a Ring sign-in problem no longer matters to what is on screen.
  const ringProblem = setupError || (streamError && explain(streamError))
  const problems = [result && !streamActive ? null : ringProblem, checkError].filter(Boolean)
  // Survey labels that would print on top of an earlier one are left out.
  const labelAt = regions.map(r => ({ x: r.box.x1 * 1600 + 30, y: r.box.y1 * height + 46 }))
  const showLabel = labelAt.map((p, i) => !labelAt.slice(0, i).some(q => Math.abs(q.x - p.x) < 260 && Math.abs(q.y - p.y) < 50))
  const picture = result ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="scene" src={result.image} alt="The camera view that was checked" />
  ) : (
    <SampleScene />
  )

  return (
    <main className="page page-gn">
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

        <p className="hero-title" aria-hidden="true">
          {verdict}
        </p>
        <div className="live-stage">
          <div className="live-frame">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera view" />
            {!streamActive && <div className="cover">{picture}</div>}
          </div>
        </div>
        <p className="caption">{isSample ? 'Sample: a drawn scene' : `Checked at ${result.time}`}</p>

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
          <div className="samples">
            <span>Or try a sample photo:</span>
            {SAMPLES.map(s => (
              <button key={s.src} type="button" onClick={() => checkSample(s.src)} disabled={checking}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {problems.map(problem => (
          <p key={problem} role="alert" className="note live-note">
            {problem}
          </p>
        ))}
        {notConfigured && (
          <p className="note live-note">
            This copy of Good Neighbour is not connected to a Ring account, so the live camera is off. Check a photo
            of your own, or try one of the sample photos.
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
        {zonesUnknown && !notConfigured && (
          <p className="note live-note">
            The camera’s existing privacy zones could not be read, so none are shown. Some of the suggested zones may
            already be in place.
          </p>
        )}

      </section>

      <section id="findings" aria-labelledby="findings-heading" className="section today">
        <div
          className="findings-bg"
          style={result ? { backgroundImage: `url(${result.image})` } : undefined}
          aria-hidden="true"
        />
        <p className="bigtype" aria-hidden="true">
          Not yours not yours not yours
        </p>
        <div className="section-head">
          <h2 id="findings-heading">Findings</h2>
        </div>
        <div className="section-body">
          {/* One sentence, set like an oversized quote, so it wraps cleanly on a phone. */}
          <p className="figures">{findings}</p>
        </div>
      </section>


      <section id="zones" aria-labelledby="zones-heading" className="section lifelist">
        <div className="section-head">
          <h2 id="zones-heading">Zones</h2>
          <p className="count">
            {suggestions.length} suggested, {zonesUnknown ? 'existing zones unknown' : `${zones.length} already set`}, Ring
            allows {MAX_ZONES}
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
                      {showLabel[i] && (
                        <text className="mark-label" x={labelAt[i].x} y={labelAt[i].y}>
                          {KIND[r.kind].label}
                        </text>
                      )}
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
                : zones.length >= MAX_ZONES && found.exposed > 0
                  ? `Your camera already uses the ${MAX_ZONES} privacy zones Ring allows. To hide more, make one of them bigger in the Ring app.`
                  : 'Nothing to suggest. Everything outside your property is already hidden.'}
            </p>
          ) : (
            <ul className="species">
              {suggestions.map((s, i) => (
                <li key={i} className="specimen">
                  {result && <div className="print" style={crop(result.image, result.ratio, s.zone)} aria-hidden="true" />}
                  <p className="meta">
                    {list(s.kinds.map(k => KIND[k].label))}. {percent(share(s.zone))} of the frame.
                  </p>
                  <h3>
                    Zone {i + 1}: {title(s.kinds)}
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

          <p className="credit">
            Sample photos from Wikimedia Commons:{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Ring_Video_Doorbell_2_capture_video_quality.jpg">a Ring doorbell</a> by Amin
            and{' '}
            <a href="https://commons.wikimedia.org/wiki/File:2022-05-28_13_25_53_Panoramic_view_across_a_front_yard_from_the_front_door_of_a_house_along_Aquetong_Lane_in_the_Mountainview_section_of_Ewing_Township,_Mercer_County,_New_Jersey.jpg">
              a front door
            </a>{' '}
            by Famartin (CC BY-SA 4.0, cropped);{' '}
            <a href="https://commons.wikimedia.org/wiki/File:View_of_suburban_house_and_street_(AM_80798-1).jpg">across the road</a>{' '}
            (CC BY 4.0).
          </p>
        </div>
      </section>
    </main>
  )
}
