# Good Neighbour

**Is your camera being a good neighbour?**

A Ring doorbell sees more than its owner's home: the street, the pavement, the
house across the road. Ring lets owners hide those parts with privacy zones, but
they have to notice the problem and draw every zone by hand. Good Neighbour
looks at what the camera actually sees, finds the parts that are not the
owner's, checks them against the zones already set, and suggests the ones that
are missing.

**Try it:** https://good-neighbour-delta.vercel.app (press a sample photo, or
check your own; the live Ring camera needs your own Ring account, so it runs
only locally, see below).

Built for the Ring track of the Build, Ship, Shape: Amazon Developer Hackathon
2026, with the AWS Builder and Open Source mini challenges.

## What it does

1. Plays the Ring camera's live stream in the browser.
2. On **Check this view**, takes the frame on screen (or, on **Check a photo**,
   a picture the owner chooses) and sends it to Amazon
   Bedrock (Qwen3-VL), which marks three kinds of area that are not the
   owner's: **road** (street or pavement), **neighbour** (another household's
   building, window, door, garden or driveway) and **vehicle** (on the public
   road).
3. At the same time, reads the camera's existing privacy zones from the Ring
   API.
4. Works out how much of the view is not the owner's, how much of that is
   already hidden, and how much is still recorded.
5. Suggests at most the privacy zones the camera has left (Ring allows two),
   placed to hide as much as possible of what is not the owner's, with their
   corners and the steps to add them in the Ring app.

The page has three parts:

- **The view**: the camera in an oval, with the headline finding written along
  its edge, for example "34% of this view is not yours and is still recorded".
- **Findings**: one sentence: share not yours, share already hidden, number of
  zones suggested.
- **Zones**: the frame with every area marked (hatched: not yours; solid:
  already hidden; dashed outline: suggested), a button to **Show what would be
  recorded** with the suggestions in place, and the list of suggested zones.

Before the first check, the page shows a **sample result** on a drawn scene and
says so. The sample's areas are made up; its percentages and suggestions are
computed by the same code as a real check.

## Cameras with encrypted video

Since September 2026 Ring has been rolling out its TAKE encryption as the
default. Ring's developer FAQ says apps can still reach a TAKE camera, but its
video arrives encrypted, so no app can open its live stream. (A camera with
full end-to-end encryption is not shown to apps at all.)

Good Neighbour reads the camera's `e2e_encryption.enabled` setting. When it is
on, the page turns off **Start live stream**, says why, and asks the owner to
take a screenshot of the camera's live view in the Ring app and use **Check a
photo**. The camera's existing privacy zones are still read, because they are
settings, not video. The same button works with no Ring token at all, for
example to try the app on any front-door photo.

## What it will not do

- **It does not change your zones.** The Ring API lets apps read privacy zones
  but not create or edit them, so the owner draws each suggested zone in the
  Ring app. This also keeps the owner in charge.
- **It does not claim to know your property line.** A model can recognise a
  road or another house; it cannot know where a garden ends. The page calls its
  output suggestions, not verdicts, and the prompt tells the model to leave out
  anything it is unsure of.
- **It never shows a failed check as a clean result.** If the model gives no
  usable answer, the page says so; "nothing found" is only shown when the model
  actually found nothing. If the camera's zones cannot be read, the page says
  that too, rather than treating the camera as having none.
- **It stores nothing.** The checked frame lives in the browser tab and is sent
  only to Bedrock.

## The hosted copy

https://good-neighbour-delta.vercel.app runs on Vercel with no Ring account, so
it offers photo checks and three sample photos, and says plainly that the live
camera is off. It uses its own Bedrock key, which expires after judging, and
allows each visitor 10 checks an hour (`CHECKS_PER_VISITOR_PER_HOUR`).

## Run it

You need Node.js 24 or newer, a Ring developer account and an AWS account.

    npm install
    cp .env.example .env.local

In `.env.local`, set:

- `RING_ACCESS_TOKEN`: from the
  [Ring Developer Playground](https://developer.amazon.com/ring/console/playground).
  It lasts 30 minutes; paste a new one and restart when it runs out.
- `AWS_BEARER_TOKEN_BEDROCK`: an Amazon Bedrock API key made in **US East (N.
  Virginia)** (Bedrock console, API keys, Long-term API keys). A brand-new AWS
  account may answer "Your account is currently being verified" for up to two
  hours.

Optional settings, with their defaults:

- `AWS_REGION=us-east-1`
- `BEDROCK_MODEL_ID`: unset, the privacy check uses Qwen3-VL
  (`qwen.qwen3-vl-235b-a22b`). Set it to try another Bedrock model, for
  example `us.amazon.nova-2-lite-v1:0`.
- `MAX_FRAMES_PER_RUN=2000`: the most pictures sent to Bedrock per server run.

Then:

    npm run dev

Open http://127.0.0.1:3000 (it opens `/privacy`), press **Start live stream**, then **Check
this view**. Or press **Check a photo** and choose a picture of the view from
the front door; this needs only the Bedrock key.

## Try the model on your own photos

The probe sends photos straight to the same Bedrock call the app uses and
prints what it found. It is the quickest way to judge the model on real
doorbell views, without the Ring stream.

    node --env-file=.env.local lib/privacy/probe.ts door.jpg driveway.jpg

Each photo is one Bedrock call. Output, per photo: each area's kind and box
(0 to 1 from the top-left), the share of the frame that is not the owner's,
and the number of zones it would suggest.

## Measure accuracy

    node --env-file=.env.local lib/privacy/eval.ts [prompt.txt] [runs] [answers.json]
    node lib/privacy/eval.ts --rescore answers.json

Scores the app's prompt (or another prompt file) on 93 labelled photos in
`docs/test-photos`: 78 with 213 expected houses, vehicles and roads, and 15
where nothing should be marked. The labelling rules are in
`docs/test-photos/LABELLING.md` and the photo credits in
`docs/test-photos/CREDITS.md`. Every figure comes with a 95% range. Saved
answers can be re-scored without calling Bedrock again. A full run uploads
about 18 MB.

Latest results, with Qwen3-VL (details in `docs/findings.md`, raw answers in
`docs/benchmark/`):

| | One run | 95% range |
|---|---|---|
| Areas found | 89% (190 of 213) | 84 to 93% |
| Roads / vehicles / houses | 98% / 96% / 82% | |
| Photos with every area found | 72% (56 of 78) | 61 to 81% |
| Empty scenes marked anyway | 7% (1 of 15) | 1 to 30% |

A second run gave the same totals.

## Tests

    npm test
    npm run typecheck

The tests cover the zone geometry, the reader for the model's reply
(including the broken replies some models send), the reader for
Ring's zones and its encryption flag, and a check that this README and the
demo script only name files, scripts and settings that exist.

## How it works

| Step | Where |
|---|---|
| Live stream (WebRTC, WHEP) | `app/hooks/useWebRTCStream.ts`, `app/api/ring/stream/` |
| Finds the camera | `app/hooks/useRingDevice.ts`, `app/api/ring/devices/` |
| Frame or photo to a JPEG at most 1024 px wide | `app/privacy/page.tsx` |
| Input checks, Bedrock key check, cost cap | `app/api/privacy/route.ts` |
| Prompt and Bedrock call (Converse API, temperature 0) | `lib/privacy/bedrock.ts`, `lib/journal/bedrock.ts` |
| Reading the model's reply | `lib/privacy/regions.ts` |
| Reading the camera's zones and encryption flag | `app/api/ring/zones/route.ts`, `lib/privacy/zones.ts` |
| Coverage and suggestions | `lib/privacy/geometry.ts` |

Details worth knowing:

- **Two coordinate systems.** The model gives boxes as `[x1, y1, x2, y2]` on a
  0 to 1000 scale, the format AWS documents for Nova object detection, which
  Qwen3-VL also uses. Ring gives zones as
  polygons with corners from 0 to 1, origin top-left. The reply reader divides
  by 1000, clamps to the frame, fixes swapped corners, and drops boxes with no
  area, unknown kinds and anything past the first 30. It accepts "neighbor" as
  well as "neighbour". About 1 reply in 8 from Nova Lite was broken JSON (a
  stray bracket) around good regions; the reader then reads each complete
  region on its own. A reply with no readable region is "no answer", never
  "nothing found".
- **The whole picture is surveyed.** The Zones view takes the shape of the
  checked picture (a phone screenshot is rarely 16:9), so the marks always sit
  on what they mark.
- **Coverage** is measured on a 100 by 100 grid of points across the frame,
  accurate to about 1% of the frame, which is finer than the model's boxes.
  Each point is tested against the zones' polygons (ray casting), so zones of
  any shape work.
- **Suggestions fit Ring's limit.** Ring allows up to 2 privacy zones per
  camera, each a box, so the app never suggests more than the camera has
  left. An area is left alone if at least 80% of it is already hidden. When
  there are more areas than free zones, two areas share one box if that hides
  little else, otherwise the smallest area is left out, whichever costs less;
  areas side by side (a car on the road, a row of houses) always share a box.
  A zone smaller than 0.3% of the frame is not suggested. The page says how
  much that is not yours would still be recorded with the suggestions in
  place.
- **Where Ring keeps the zones.** Ring's guide names the `privacy_zones` field
  of the device configurations reply but not where it sits. Another Ring-track
  app documents it at `configurations.image_enhancements.privacy_zones`; the
  reader searches the whole reply, so it finds the field there or anywhere
  else. Unusable zones are skipped.
- **Cost and abuse limits.** The check route accepts only base64 under 2
  million characters, refuses work when the Bedrock key is missing, times out
  a Bedrock call after 15 seconds, and stops after `MAX_FRAMES_PER_RUN` checks
  until restarted. A bad value for that setting falls back to the default, so
  a typo cannot remove the cap.

## Limits

- **Houses are the weak spot.** On the 93-photo benchmark it finds 98% of
  roads and 96% of vehicles but 82% of houses; half the missed houses fill
  most of the photo, perhaps because a house that close looks like the
  owner's own. The labels were drawn by one person, and 15 empty scenes are
  too few to pin the false-alarm rate down (1 to 30%).
- Areas are rectangles, so a suggested zone can cover a little more than the
  area itself.
- A check uploads a picture of about 200 KB. On a slow connection this takes
  most of the time (up to about a minute was measured); Bedrock itself
  answers in about a second. The check waits up to 90 seconds.
- The live stream is tested only against the Ring Developer Playground's
  sandbox camera, whose video is not encrypted. The encrypted-camera path is
  built from Ring's documentation and covered by tests, but has not been seen
  on a real TAKE camera.
- One camera, one user, one laptop. Nothing is hosted.

## What uses what

- **Ring API**: device discovery, device location, live stream (WHEP), device
  configurations (privacy zones and the encryption flag).
- **Amazon Bedrock**: Qwen3-VL through the Converse API, with API-key
  authentication. It was chosen over Amazon Nova Lite, Nova 2 Lite and Nova
  Pro, Llama 4 Maverick, Pixtral Large and Gemma 3 by the scorecard below; see
  `docs/findings.md`.

Product feedback on all of these, as the hackathon asks, is in `FEEDBACK.md`.

## Also in this repository

The project began as **Ring Bird Journal**, which names the birds that visit a
feeder and keeps a life list. It still runs at http://127.0.0.1:3000/birds and its
code is in `lib/journal/`. It was set aside because a bird app for Ring
cameras already exists. Good Neighbour reuses its live stream, its Bedrock
call, its cost cap and its visual design.

## Credits

Based on [ring-api-helloworld](https://github.com/AmazonAppDev/ring-api-helloworld)
by Amazon, used under the MIT licence. The live-stream code is theirs.

The visual design is modelled on the Thyssen-Bornemisza museum's
[Return to Nature](https://www.museothyssen.org/webdocs/conectathyssen/volver-naturaleza/en/)
webdoc. Only its layout and style were followed; none of its images, text or
font files are used. See `DESIGN.md`.

## Licence

MIT. See `LICENSE`.
