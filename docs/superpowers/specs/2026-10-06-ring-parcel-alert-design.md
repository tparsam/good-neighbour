# Ring Parcel Alert: design

Date: 2026-10-06
Status: awaiting review

## Purpose

A web app for deaf and hard-of-hearing residents. It watches a Ring doorstep
camera and shows a large visual alert when a parcel arrives or is taken, so the
resident does not depend on hearing a doorbell.

It is an entry for the "Build, Ship, Shape" Amazon Developer Hackathon, Ring
track, plus the AWS Builder and Open Source mini challenges.

- Submission deadline: Friday 23 October 2026, 12:00pm Pacific (11:00pm UAE).
- Deliverables: working demo, public GitHub repo with an open-source licence,
  demo video under 3 minutes, product feedback on each Amazon tool used.

## Success criteria

1. With the Ring Playground "Package" stream playing, the app shows
   "A parcel arrived" without any manual trigger.
2. If the footage shows the parcel being removed, the app shows
   "Someone took your parcel".
3. Alerts are understandable with the sound off and from across a room.
4. The whole flow can be recorded on one laptop in under 3 minutes.
5. Total AI cost stays under $5.

## Constraints found during research

- No physical Ring device. The Ring Developer Playground gives one sandbox
  camera and three stock clips: Package, Vehicle, Motion.
- The Playground sends no motion, package or doorbell notifications. Each
  button only opens a live video stream, logged as `on_demand`. The app must
  analyse video frames itself.
- The Playground token is read-only and lasts 30 minutes.
- After a stream closes, the Playground locks its buttons for about 20 seconds.
- The app runs locally only. No hosting.

## Starting point

Amazon's `AmazonAppDev/ring-api-helloworld` (MIT, commit `76100aa`,
Next.js 15, React 18, Tailwind). It already provides:

- `app/api/ring/stream/route.ts` and `app/hooks/useWebRTCStream.ts`: live
  stream playback.
- `lib/video-processors/`: a plug-in interface, `VideoProcessor`, whose
  `process(frame, canvas, video)` is called on video frames.
- `lib/auth.ts`: reads `RING_ACCESS_TOKEN` from `.env.local`.

The project is a copy of this starter with its licence and attribution kept.
Demo-only parts that are not used (the MediaPipe hand game, the heatmap and
brightness examples, webhook routes) are removed.

## Architecture

Four small units, each testable on its own.

### 1. Frame sampler (browser)

A `VideoProcessor` plug-in. About every 2 seconds it takes the current frame,
downsizes it to 512px wide, and compares it with the last frame it sent using
a cheap pixel difference. If the picture has not changed enough, it sends
nothing. Otherwise it posts the frame as a JPEG to `/api/analyze`.

- Depends on: the starter's video-processor pipeline.
- Produces: one observation per analysed frame.

### 2. Analyze route (server)

`POST /api/analyze` receives a JPEG, calls Amazon Bedrock with Nova Lite, and
returns an observation:

```json
{ "parcel": true, "person": false }
```

- The prompt asks for exactly this JSON and nothing else. The reply is
  validated with Zod (already a dependency). An invalid reply is treated as
  "no observation", never as a guess.
- Bedrock is called over HTTPS with `fetch` and a Bedrock API key read from
  `.env.local` on the server. No AWS SDK is added. The key never reaches the
  browser.
- A per-process counter caps analysed frames (default 2,000 per run) and the
  route refuses further calls beyond it. This is the hard cost stop.

### 3. Alert logic (pure function)

`nextState(state, observation, now) -> { state, alert | null }`

- An observation must repeat on 2 consecutive frames before it counts, so one
  wrong answer from the model cannot fire an alert.
- No parcel, then parcel: alert `PARCEL_ARRIVED`.
- Parcel, then no parcel, with a person seen in the last 15 seconds:
  alert `PARCEL_TAKEN`.
- Parcel, then no parcel, with no person seen: alert `PARCEL_GONE`.
- Each alert fires once per change, not on every frame.

It has no dependency on the browser, the network or the clock (time is passed
in), so it is fully unit-testable.

### 4. Alert display (browser)

- Full-screen colour flash with a large text message and an icon, held until
  the resident dismisses it.
- A browser notification, if the resident has granted permission.
- A timestamped alert history.
- Flashing is a slow colour change, at most 2 changes per second, and is
  replaced by a steady banner when the system "reduce motion" setting is on.
  Fast flashing is a seizure risk.

## Error handling

- Ring token expired or missing: a plain message saying the 30-minute token
  ran out, with the steps to get a new one from the Playground. Alerts stop;
  nothing is shown as "all clear".
- Bedrock key missing, call fails, or cap reached: a visible "Not watching"
  status with the reason. The video keeps playing.
- Stream ends or drops: status changes to "Camera offline".

The app always shows whether it is currently watching, so a quiet screen is
never mistaken for a safe doorstep.

## Testing

- Unit tests for the alert logic, run with Node's built-in test runner
  (`node --test`). No test framework is added.
- A unit test for the analyze route's reply parsing, using saved example
  replies including malformed ones.
- A manual end-to-end check with the Playground Package stream, recorded for
  the demo video.

## User interface

The starter's dashboard layout is replaced with a single-purpose screen: the
camera view, a status line, the alert layer, and the history. The visual
design follows the owner's standing design workflow at build time. Hard
requirements regardless of look: WCAG AA contrast, no meaning carried by
colour alone, works at 1440x900 and 390x844, light and dark themes.

## Out of scope

- Phone vibration, smart-light flashing, SMS or email.
- Hosting or multi-user accounts.
- Vehicle and Motion clips.
- Refresh-token sign-in and real customer devices.
- In-app token entry: a new token means editing `.env.local` and restarting.

## Not yet verified

These are checked first during the build, before code depends on them.

1. Whether the Package clip shows the parcel arriving, a person, and the
   parcel being taken. Only one frame has been seen. If the clip starts with
   the parcel already present, criterion 1 is met by the parcel being detected
   on first sight.
2. The Bedrock request format for Nova Lite with an image, the model
   identifier, and API-key authentication.
3. Whether a new AWS free-plan account can call Nova Lite straight away.
4. How the starter's video-processor pipeline schedules frames, and whether
   it runs fine when sampling every 2 seconds.
5. Nova Lite's accuracy on this footage. If it is unreliable, the fallback is
   Nova Pro (about $7 for the project by estimate).

## Costs

Estimate: about $0.50 with Nova Lite, assuming about 5,000 analysed frames at
roughly 1,500 tokens each. The change filter and the per-run cap keep real
usage below that. A $5 AWS budget alert is set on the account.
