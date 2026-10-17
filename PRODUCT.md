# Good Neighbour

Rewritten on 2026-10-17 for Good Neighbour, the app this project became. The
first app built here, Ring Bird Journal, still runs at `/birds`.

## What it is

A web app that answers one question for the owner of a Ring camera: is your
camera being a good neighbour? It looks at what the camera sees, marks what is
not the owner's (the street, neighbours' houses, vehicles on the road), checks
that against the privacy zones the camera already has, and suggests the zones
to add, within Ring's limit of two per camera.

## Who it is for

- **A Ring owner** who wants to respect the neighbours and stay on the right
  side of privacy law, but has never drawn a privacy zone, or drew one years
  ago and moved the camera since. They are not technical. They check once,
  add a zone in the Ring app, and leave.
- **Hackathon judges at Amazon**, who see it in a video under 3 minutes and
  in the GitHub repo. Design is one of the judging criteria.

## What it must do on screen

One page, three parts:

1. **The view:** the camera picture (live, or a photo the owner chose), the
   answer in one line ("5% of this view is not yours and is still
   recorded"), and the actions: start the live stream, check this view,
   check a photo.
2. **Findings:** one sentence: how much is not yours, how much is already
   hidden, how many zones are suggested, and how much would still be recorded.
3. **Zones:** the picture with every area marked, a switch to show what would
   be recorded with the suggestions in place, each suggested zone with its
   corners, and the steps to add it in the Ring app.

## How it should feel

A calm, honest survey, like a museum plate rather than a security dashboard.
The subject is privacy, so the page must never feel like it is watching or
accusing anyone. It reports, explains and suggests.

## Product truths the design must respect

- **It never claims to know where the property ends.** It can recognise a road
  or another house, not a boundary. Its zones are suggestions, not verdicts.
- **A failed check is never shown as a clean result.** "No usable answer" and
  "nothing found" are different, and both are said in words.
- **It never suggests more zones than Ring allows** (two per camera, boxes),
  counting the zones the camera already has.
- **The drawn sample is always labelled as a sample** and never passed off as
  a real result.
- **Waiting is explained.** On a slow connection a check can take a minute; the
  page says so while it waits.
- **Encrypted cameras are handled, not hidden.** When Ring's encryption stops
  apps seeing the video, the page says why and offers the photo check.
- **The Ring token runs out every 30 minutes**, so that message is common. It
  must be clear and calm.

## Constraints

- Next.js 15, React 18, Tailwind 3. No new npm dependencies.
- WCAG AA contrast; no meaning carried by colour alone (marks differ by
  pattern: hatched, solid, dashed).
- Works at 1440x900 and 390x844, in light and dark themes, and installs to a
  phone's home screen.
- Fonts self-hosted, so the page works offline.
