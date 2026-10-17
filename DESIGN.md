---
name: Good Neighbour
description: A calm survey of what a Ring camera records that is not the owner's, set like a fashion lookbook printed on paper.
colors:
  paper: "#e4dfd8"
  ink: "#1d1c1b"
  muted: "#55514c"
  accent-red: "#9b2a2c"
  findings-dark: "#24211e"
  findings-text: "#ece7e0"
  paper-dark: "#171615"
  ink-dark: "#e6e1da"
  muted-dark: "#aaa49c"
  accent-red-dark: "#d0645e"
typography:
  display:
    fontFamily: "Instrument Serif, Times New Roman, serif"
    fontSize: "clamp(2.6rem, 5vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Shippori Mincho, Hiragino Mincho ProN, Times New Roman, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Archivo, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  gutter: "1.25rem"
  section: "clamp(6rem, 12vw, 9rem)"
components:
  text-action:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    height: "44px"
    padding: "0 0.9rem"
  findings-band:
    backgroundColor: "{colors.findings-dark}"
    textColor: "{colors.findings-text}"
---

# Design System: Good Neighbour

## Overview

Chosen by the owner on 2026-10-17, modelled on PARCO's 2026 AW campaign page
(parco.jp/style). Only its layout and style are followed; none of its images,
text or font files are used. The styles live in `app/privacy/look.css`, on top
of the shared base in `app/globals.css`.

The page reads like a lookbook printed on paper: a tall condensed title over a
small photo print, quiet words for actions, one dark band where the result is
read, and the camera's picture cut into prints for each suggested zone. The
subject is privacy, so nothing shouts and nothing accuses; the page surveys,
explains and suggests.

The bird journal at `/birds`, the first app in this repository, keeps the
earlier museum look described in git history; it does not load `look.css`.

## Colors

### Primary
- **Accent red** `#9b2a2c` (dark theme `#d0645e`): used once on the page, for
  the Zones heading. Nothing else is red.

### Neutral
- **Paper** `#e4dfd8` with a film-grain layer; **ink** `#1d1c1b`; **muted**
  `#55514c` for credits and disabled actions.
- **Findings band** `#24211e` with `#ece7e0` text, the checked picture blurred
  behind it at 55% opacity.
- Dark theme: paper `#171615`, ink `#e6e1da`, muted `#aaa49c`. It follows
  `prefers-color-scheme`.

### Named Rules
- **One red, once.** The accent marks one heading per page.
- **Meaning never by colour.** The survey's marks differ by pattern: hatched
  (not yours), solid (already hidden), dashed outline (suggested).

## Typography

- **Display:** Instrument Serif, uppercase, for the title, section headings,
  zone titles and the text actions. It stands in for PARCO's condensed serif.
- **Body:** Shippori Mincho, for sentences: the answer under the print, the
  findings, notes and the steps to add a zone. It stands in for PARCO's Kozuka
  Mincho.
- **Labels:** Archivo at 0.75 to 0.8125rem for the stacked section links, the
  legend, zone labels and corners.

### Hierarchy
- Title `clamp(2.6rem, 5vw, 4.25rem)`; section headings `clamp(2.4rem, 4vw,
  3.5rem)` (Zones up to 4.5rem); zone titles about 2rem; the answer line
  `clamp(1.25rem, 1.8vw, 1.6rem)`; findings text `clamp(1.15rem, 1.7vw,
  1.45rem)` at 1.85 line height.

### Named Rules
- **Caps for short headings only.** Sentences, counts, legends and labels stay
  in normal case.

## Layout

- **Top:** the small wordmark at the top left; the section links (The view,
  Findings, Zones) stacked in tiny caps at the top right, fixed.
- **The view:** centred. The verdict in tall caps ("5% not yours"), then the picture as a small print
  (`min(56vw, 720px)`, 16:9), a small caption ("Sample: a drawn scene" or
  "Checked at 22:03"), then the answer in one sentence, then the actions
  as words separated by slashes, then the sample photos, then any notes.
- **Findings:** a full-width dark band: heading on the left, the finding on the
  right (one column on phones); the words "Not yours" repeat oversized and cropped along its bottom.
  In dark mode the band turns to paper so it still stands apart.
- **Zones:** the heading in red, left aligned; the survey as a print turned
  -1.2 degrees; then one print per suggested zone, cut from the picture,
  staggered on the 12-column grid and turned slightly each way; then the steps
  to add a zone and the photo credits.
- **Phones (under 768px):** one column; the print fills the width; actions
  stack; nothing scrolls sideways (the page clips the oversized type and the
  blurred photo).

## Elevation & Depth

- No cards. Depth comes from prints: a soft shadow tinted to the paper,
  `0 18px 40px -12px rgb(60 48 36 / 0.22)` on the survey and
  `0 14px 30px -12px` on zone prints.
- Film grain: a fixed, click-through noise layer over the page (multiply in
  light, screen at low opacity in dark).

## Shapes

- Square corners everywhere. Prints are rectangles at the picture's own shape,
  never cropped to a fixed ratio, so marks line up.
- Small "+" marks at the corner of each zone print.

## Components

### Actions
- Words, not boxes: `START LIVE STREAM / CHECK THIS VIEW / CHECK A PHOTO`,
  each at least 44px tall. Hover underlines; disabled actions fade to 38% ink.
- "Show what would be recorded" is an underlined text action under the survey.

### Navigation
- Three stacked links at the top right; on phones they stay small.

### Zone prints
- Each suggested zone is shown as a print of that part of the picture: CSS
  background crop, aspect ratio from the zone, at most 420px tall.

### Notes and errors
- Mincho text under the actions, no rules or boxes; errors are announced with
  `role="alert"`.

## Do's and Don'ts

- **Do** keep sentences in normal case and caps for short headings.
- **Do** keep the one red heading; **don't** add a second accent.
- **Don't** add an entry gate, sound control or warped photos: PARCO's are
  for a campaign, not a tool.
- **Known detector findings, checked and kept on purpose** (impeccable detect,
  2026-10-17): the oversized cropped words in Findings are uppercase and set
  tight (decorative, hidden from screen readers); "The view" heading reports
  overflow because it is visually hidden for screen readers; the legend's
  hatch swatch is a repeating stripe because it must match the survey's
  hatching. The detector could only ignore these file-wide, so they are
  recorded here instead.
