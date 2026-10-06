'use client'

import { useState } from 'react'
import { coverage, suggestZones } from '@/lib/privacy/geometry'
import type { RegionKind, Zone } from '@/lib/privacy/types'
import { SampleScene } from './SampleScene'
import { SAMPLE_REGIONS, SAMPLE_ZONES } from './sample'

const KIND: Record<RegionKind, { label: string; title: string }> = {
  road: { label: 'Road', title: 'The road and pavement' },
  neighbour: { label: 'Neighbour', title: 'The neighbour’s house' },
  vehicle: { label: 'Vehicle', title: 'A vehicle on the road' },
}

const percent = (share: number) => `${Math.round(share * 100)}%`
const points = (zone: Zone) => zone.map(p => `${p.x * 1600},${p.y * 900}`).join(' ')
const corners = (zone: Zone) => zone.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`).join('  ')
const share = (zone: Zone) => (zone[1].x - zone[0].x) * (zone[2].y - zone[1].y)

export default function PrivacyCheck() {
  // The sample stands in for the vision model's answer; everything below it is the real logic.
  const regions = SAMPLE_REGIONS
  const zones = SAMPLE_ZONES
  const found = coverage(regions, zones)
  const suggestions = suggestZones(regions, zones)
  const [asRecorded, setAsRecorded] = useState(false)

  const findings =
    `${percent(found.outside)} not yours, ${percent(found.hidden)} already hidden, ` +
    `${suggestions.length} ${suggestions.length === 1 ? 'zone' : 'zones'} suggested`
  const summary = `${percent(found.exposed)} of this view is not yours and is still recorded`

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="masthead-title">Good Neighbour</h1>
        <p className="masthead-date">Sample result</p>
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
            <SampleScene />
          </div>
          {/* The title arches over the oval and the finding runs under it. Decorative copies only;
              the real heading is the h1 and the real finding is the paragraph below. */}
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
          <p className="state">
            <span className="state-line">{summary}</span>
          </p>
        </div>

        <p className="note live-note">
          This is a sample result on a drawn scene, not a real camera. The areas marked as not yours are made up; the
          percentages and the suggested zones are worked out from them by the app. Checking a real camera needs a
          Ring token and an Amazon Bedrock key.
        </p>

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
            {suggestions.length} suggested, {zones.length} already set
          </p>
        </div>

        <div className="section-body">
          <figure className="survey">
            <div className="survey-frame">
              <SampleScene />
              <svg className="survey-marks" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
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
                        y={r.box.y1 * 900}
                        width={(r.box.x2 - r.box.x1) * 1600}
                        height={(r.box.y2 - r.box.y1) * 900}
                        fill="url(#hatch)"
                      />
                      <text className="mark-label" x={r.box.x1 * 1600 + 30} y={r.box.y1 * 900 + 46}>
                        {KIND[r.kind].label}
                      </text>
                    </g>
                  ))}
                {suggestions.map((s, i) => (
                  <polygon key={i} className={asRecorded ? 'mark-hidden' : 'mark-suggested'} points={points(s.zone)} />
                ))}
                {zones.map((zone, i) => (
                  <polygon key={i} className="mark-hidden" points={points(zone)} />
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
            <p className="empty">Nothing to suggest. Everything outside your property is already hidden.</p>
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
