# Ring Bird Journal: design

Date: 2026-10-06
Status: awaiting review
Replaces: the parcel alert design of the same date, dropped because stronger
entries already cover deaf-resident alerts and parcel theft.

## Purpose

A web app that turns any outdoor Ring camera into a smart bird feeder camera.
It watches the camera's live stream, notices when a bird visits, names the
species, saves a snapshot, and builds a personal life list of every bird seen.

It is an entry for the "Build, Ship, Shape" Amazon Developer Hackathon, Ring
track, plus the AWS Builder and Open Source mini challenges.

- Submission deadline: Friday 23 October 2026, 12:00pm Pacific (11:00pm UAE).
- Deliverables: working demo, public GitHub repo with an open-source licence,
  demo video under 3 minutes, product feedback on each Amazon tool used.

## Why this idea

- No other public Ring-track entry found covers birds, wildlife or gardens.
- The Ring Playground's "Motion" clip is real footage of birds at feeders, so
  the demo runs on Ring's own stream with nothing mocked.
- Ring owners already have an outdoor camera; this gives it a use that is not
  about security.

Known weakness: it sits outside the track's listed priority categories (access
control, business systems, home automation, accessibility, caretaking).

## Success criteria

1. With the Playground Motion stream playing, the app records at least one
   bird visit, with a name and a snapshot, without any manual trigger.
2. A bird that stays for a while counts as one visit, not one per frame.
3. The life list survives closing and reopening the app.
4. The app never shows a species name it is not reasonably sure of.
5. The whole flow can be recorded on one laptop in under 3 minutes.
6. Total AI cost stays under $5.

## Constraints found during research

- No physical Ring device. The Playground gives one sandbox camera and three
  stock clips: Package, Vehicle, Motion.
- The Playground sends no event notifications. Each button only opens a live
  video stream, logged as `on_demand`. The app must analyse frames itself.
- The Playground token is read-only and lasts 30 minutes.
- After a stream closes, the Playground locks its buttons for about 20 seconds.
- The app runs locally only. No hosting.

## Starting point

Amazon's `AmazonAppDev/ring-api-helloworld` (MIT, commit `76100aa`,
Next.js 15, React 18, Tailwind). It already provides:

- `app/api/ring/stream/route.ts` and `app/hooks/useWebRTCStream.ts`: live
  stream playback.
- `lib/auth.ts`: reads `RING_ACCESS_TOKEN` from `.env.local`.

The project is a copy of this starter with its licence and attribution kept.
Parts that are not used (the video-processor plug-in system and its examples,
the MediaPipe hand game, webhook routes) are removed.

## Architecture

Five small units, each testable on its own.

### 1. Frame sampler (browser)

A small React hook. The starter's plug-in system was read and found to be
built around an overlay panel this app does not have, so a plain timer is
simpler. About every 2 seconds it takes the current frame,
downsizes it to 768px wide, and compares it with the last frame it sent using
a cheap pixel difference. If the picture has not changed, it reuses the last
answer without calling the AI. Otherwise it posts the frame as a JPEG to
`/api/analyze`.

### 2. Analyze route (server)

`POST /api/analyze` receives a JPEG, calls Amazon Bedrock with Nova Lite, and
returns an observation:

```json
{ "birds": [ { "name": "Red-bellied Woodpecker", "confidence": "high" } ] }
```

- `confidence` is `high`, `medium` or `low`. The prompt tells the model to
  fall back to a broader name ("woodpecker") or to "unidentified bird" when
  unsure, and to return an empty list when no bird is visible.
- The camera's country and state, read once from the Ring device location
  API, are included in the prompt so the model favours birds found there.
- The reply is validated with Zod (already a dependency). An invalid reply is
  treated as "no observation", never as a guess.
- Bedrock is called over HTTPS with `fetch` and a Bedrock API key read from
  `.env.local` on the server. No AWS SDK is added. The key never reaches the
  browser.
- A per-process counter caps analysed frames (default 2,000 per run). This is
  the hard cost stop.

### 3. Visit logic (pure function)

`nextState(state, observation, now, fresh) -> { state, started, ended }`

Several birds can be present at once, so it returns lists. `fresh` is false
when a reused answer is passed in: that keeps an open visit alive but never
counts towards confirming a new one.

- A bird must be named on 2 consecutive frames before a visit starts, so one
  wrong answer cannot create a sighting.
- While the same bird keeps being seen, the visit stays open.
- A visit ends when that bird has not been seen for 10 seconds. The finished
  visit is returned with its name, start, end and best confidence.
- `low` confidence observations are recorded as "Unidentified bird".

It has no dependency on the browser, the network or the clock (time is passed
in), so it is fully unit-testable.

### 4. Journal store (server)

Finished visits are appended to `data/visits.json`, and one snapshot per visit
is saved to `data/snapshots/`. Both are plain files, ignored by git.

This is a single-user, single-laptop store. Its ceiling is a few thousand
visits; a database is the upgrade path if it ever needs more.

### 5. Screens (browser)

- **Live:** the camera view, a "watching / not watching" status, and the name
  of any bird currently at the feeder.
- **Life list:** one card per species with its best snapshot, first-seen date
  and number of visits.
- **Today:** species count, visit count and busiest hour. These are computed
  from the stored visits. No AI is used for the summary.

## Error handling

- Ring token expired or missing: a plain message saying the 30-minute token
  ran out, with the steps to get a new one from the Playground.
- Bedrock key missing, call fails, or cap reached: a visible "Not watching"
  status with the reason. The video keeps playing.
- Stream ends or drops: status changes to "Camera offline". An open visit is
  closed and saved.
- A failed write to the journal is reported on screen, not silently dropped.

## Testing

- Unit tests for the visit logic, the analyze route's reply parsing (including
  malformed replies) and the Today summary, run with Node's built-in test
  runner (`node --test`). No test framework is added.
- A manual end-to-end check with the Playground Motion stream, recorded for
  the demo video.

## User interface

The starter's dashboard is replaced by the three screens above. The visual
design follows the owner's standing design workflow at build time. Hard
requirements regardless of look: WCAG AA contrast, no meaning carried by
colour alone, works at 1440x900 and 390x844, light and dark themes.

## Out of scope

- Correcting or renaming a species by hand.
- Bird sounds, although the stream may carry audio.
- Sharing, exporting, or sending sightings to citizen-science sites.
- Notifications for rare birds.
- Hosting, accounts, more than one camera.
- In-app token entry: a new token means editing `.env.local` and restarting.

## Not yet verified

These are checked first during the build, before code depends on them.

1. What video the sandbox camera serves when the app opens its own stream,
   as opposed to pressing the Playground's Motion button. If it is not the
   bird clip, the app needs the Playground button pressed first, or another
   way to select the clip.
2. How long a Playground stream lasts and whether the clip loops. A short
   stream limits how many visits one demo run can record.
3. Which birds are in the clip, and Nova Lite's accuracy on them. If it is
   unreliable, the fallback is Nova Pro (about $7 for the project by
   estimate).
4. The Bedrock request format for Nova Lite with an image, the model
   identifier, and API-key authentication.
5. Whether a new AWS free-plan account can call Nova Lite straight away.
6. Whether the device location API returns a usable country and state for the
   sandbox camera.

## Costs

Estimate: about $0.50 with Nova Lite, assuming about 5,000 analysed frames at
roughly 1,500 tokens each. The change filter and the per-run cap keep real
usage below that. A $5 AWS budget alert is set on the account.
