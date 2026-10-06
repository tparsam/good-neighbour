# Design system: Ring Bird Journal

Chosen by the owner on 2026-10-06. The look is modelled on the
Thyssen-Bornemisza museum's "Return to Nature" webdoc
(museothyssen.org/webdocs/conectathyssen/volver-naturaleza/en/). Only its
layout and style were followed; none of its images, text or font files are
used. All styles live in `app/globals.css`.

## The idea

A museum page for a garden. The camera view is an oval picture with the title
arched over it and the state running along the curve underneath. Type does
the rest: a tall condensed uppercase serif against a plain grotesk, black on
light grey.

## Colour

Tokens are CSS variables on `:root` and switch on `prefers-color-scheme`.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#F5F5F5` | `#111111` | Page background |
| `--ink` | `#0A0A0A` | `#F1F1EE` | Text, rules, button outline |
| `--muted` | `#4A4A4A` | `#B4B4AE` | Idle-frame text, disabled button, empty snapshot |
| `--accent` | same as ink | same as ink | Focus ring and text selection |

- There is no accent colour. Ink and paper only.
- The idle camera frame is ink mixed into the background at 7%.
- State is always written in words. Nothing is signalled by colour.

## Type

- Display: Instrument Serif 400, always uppercase, tracking -0.02em. It
  stands in for the reference's Glossy Display. Used for the arched title,
  the state on phones, the button, Today's figures, the Life list title and
  species names.
- Text: Archivo 400 (600 for the wordmark). It stands in for Neue Haas
  Grotesk. Used for labels, dates, notes and the curved state line.
- Both load through `next/font/google`, which self-hosts them at build time.
- Sizes: arched title 176 units in a 1600-unit frame (it scales with the
  oval); Life list title up to 150px; Today's figures up to 120px; species
  names 30 to 36px; button 28px; body and labels 15px; wordmark and date 13px.
- Labels are uppercase grotesk at body size. They are data labels (a date, a
  count), never a kicker above a heading.

## Layout

- **Top bar:** sticky, 64px, one 1px rule under it. Wordmark left, date right.
- **Section links:** one row under the bar. The first sits left, the rest right.
- **Live:** centred. The oval frame is `min(74vw, 1050px)` wide and 16:9. An
  SVG laid over it draws the title along the top of the oval and the state
  along the bottom. Under it: the reason (if too long for the curve), the
  oval button, any message, and a thin chevron that links to Today.
- **Today:** left aligned. The three figures are set as one oversized quote
  in guillemets: «2 species, 5 visits, 9:00 busiest hour».
- **Life list:** a centred oversized title with the species count, then
  blocks staggered on a 12-column grid in a repeating pattern of three: left,
  right and lower, then centre. Each block is a label line (first seen,
  visits), the species name, then the 16:9 snapshot.
- **Phone (under 768px):** one column. The arched title stays. The curved
  state line is hidden and the state is set straight under the oval.

## Shape

- Ovals for the camera frame (`border-radius: 50%`) and the button. Square
  corners everywhere else.
- Rules and outlines are 1px ink. No shadows, no gradients, no cards.
- A species with no snapshot gets a 1px outlined 16:9 box that says so.

## Ornaments

Two thin 1px line drawings, both `aria-hidden` or labelled: the down chevron
under Live (a real link to Today) and a hand-drawn curve between Today and
Life list.

## Accessibility notes

- The arched title and curved state are decorative copies (`aria-hidden`).
  The real heading is the `h1` in the top bar; the real state is the
  `role="status"` element, kept for screen readers on wide screens and shown
  on phones.
- Focus is a 2px ink outline, offset 3px.
- The only motion is the button press; it sits inside
  `prefers-reduced-motion: no-preference`.

## Known trade-off

The oval hides the corners of the camera picture, about a fifth of the frame.
A bird in a corner is not visible in the live view. Identification still
uses the full frame, and saved snapshots are full rectangles.
