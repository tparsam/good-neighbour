# Ring Bird Journal

Written from the approved design spec
(`docs/superpowers/specs/2026-10-06-ring-bird-journal-design.md`), not from an
interview.

## What it is

A local web app that turns an outdoor Ring camera into a smart bird feeder
camera. It watches the camera's live stream, names the birds that visit, saves
a snapshot of each visit, and keeps a life list.

## Who it is for

- A person at home with a Ring camera pointed at a garden or feeder, who enjoys
  noticing birds but is not an expert birder. They glance at it through the
  day, often from across a room or on a phone.
- Hackathon judges at Amazon, who will see it in a video under 3 minutes.
  Design is one of four judging criteria.

## What it must do on screen

One page, three areas:

1. **Live**: the camera view, whether the app is watching or not (and why
   not), and the name of any bird at the feeder right now.
2. **Today**: species seen, number of visits, busiest hour.
3. **Life list**: one entry per species with its best snapshot, the date first
   seen, and the number of visits.

## How it should feel

A naturalist's field journal: calm, observant, a little bit delighted. It is
the opposite of a security dashboard. Ring is known for watching for threats;
this is the same camera used for something gentle.

## Product truths the design must respect

- The app never claims a species it is unsure of. Unclear birds are recorded
  as "Unidentified bird". The design must not make guesses look certain.
- A quiet screen must never be mistaken for a working one. "Watching" and
  "Not watching" are always stated in words.
- Snapshots are frames from a home security camera: wide-angle, 16:9,
  sometimes snowy or dim, with the subject small in the frame. They are not
  portrait photography.
- A new journal is empty. A typical demo journal has two or three species.
  A keen user's might have dozens.
- The Ring token expires every 30 minutes, so the "token ran out" message is
  seen often. It should be clear and unalarming.

## Constraints

- Next.js 15, React 18, Tailwind 3. No new npm dependencies.
- WCAG AA contrast, no meaning carried by colour alone.
- Works at 1440x900 and 390x844, in light and dark themes.
- Runs locally and may be offline: fonts must be self-hosted or system fonts.
