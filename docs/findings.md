# Findings from the live Playground

Checked on 2026-10-06 through the Ring Developer Playground page itself, before
the app existed. Sections marked "not yet checked" need the app running with a
live token.

## Which clip the app's own stream shows

Not yet checked.

In the Playground, the three "Simulate live view event" buttons each open a live
stream of stock footage: Motion shows birds at snowy feeders, Package shows a
porch with a parcel, Vehicle shows a driveway. The request the Playground
displays is the same for all three (a POST to the device's WHEP sessions
endpoint), so how the clip is chosen is not visible from the page.

## How long a stream lasts, and whether it loops

Not yet checked. After closing a stream, the Playground showed "Event is still
streaming. You can select a new event in 17s", so a stream runs for at least
some tens of seconds.

## Does pressing Motion in the Playground change what the app's stream shows

Not yet checked.

## Device location response

Not yet checked.

## First live run with the app (2026-10-17, from the UAE)

- **Devices:** the token's account has one camera, "Playground Device",
  reported as `online: false`.
- **Configurations, confirmed:** privacy zones sit at
  `data.attributes.image_enhancements.privacy_zones` (empty on this camera)
  and the encryption flag at `data.attributes.e2e_encryption.enabled`
  (`false`). The camera also has a motion zone at
  `data.attributes.motion_detection.motion_zones`, which the app rightly does
  not count as a privacy zone. The app's zones route returned
  `{"zones":[],"encrypted":false}`.
- **Live stream:** Ring accepted every stream request (POST 200 in 2 to 5 s).
  Once, video played at 1280 x 720. Every stream then ended within seconds
  with "The camera stream ended", before a frame could be checked; once no
  video arrived within 20 s.
- **Likely cause, not yet confirmed:** the app ended a stream as soon as the
  connection reported "disconnected", which in WebRTC is often temporary on a
  slow network. It now waits 5 s for it to recover and logs every state
  change ("Ring stream connection: ...") so the next run shows the cause.
- **Network:** connecting to Ring's servers (`api.amazonvision.com`, which
  resolved to eu-south-2) took 2 to 3 s and sometimes more than Node's 10 s
  connect limit, so some requests failed with "fetch failed". This was worse
  while other uploads were running on the same connection.
- **Second live run, same day, with a fresh token:** video arrived 3.5 s
  after pressing Start, and a 1280 x 720 live frame went through the whole
  check: Nova answered in 7.3 s and the camera's real zones (none) were read.
  The stream log showed `connecting`, `connected` (8.6 s), then
  `disconnected` about 20 s later: the sandbox clip simply ends, so the
  dropped streams were the clip finishing, not a fault.
- The first check that day failed with "fetch failed": the secure connection
  to Bedrock took over Node's 10 s connect limit. A connect timeout is now
  retried once. The page also hid the check's error behind "The camera stream
  ended"; it now shows both.
- **The clip:** the stream showed the Playground's porch clip (snowy steps
  with a parcel), nearly all of it the owner's own property. Nova Lite marked
  77% of it as "road", the owner's steps and parcel included. On the same
  frame, Nova Pro marked 13% (a snowy area top right) as a neighbour's, and
  Nova 2 Lite and Qwen3-VL marked nothing, which is right.

## How well Nova Lite marks what is not the owner's

Checked on 2026-10-17 with `us.amazon.nova-lite-v1:0` at temperature 0, on two
public photos taken from across a residential street (Wikimedia Commons, "View
of suburban house and street", AM 80798-1 and -2, CC BY 4.0), each resized to
1024 px wide. Seen from a front door opposite, the road and every house in
these photos are not the owner's.

- **The road was found every time**, with a tight box along the bottom of the
  frame (photo 1: y from 0.83 to 1.00; photo 2: y from 0.78 to 0.94).
- **The houses were found only some of the time.** On photo 1, the house on
  the right was marked as "neighbour" in some runs and missed in others. The
  large house straight across the road was not marked in any run. Through the
  page (same photo, re-encoded by the browser), only the road was marked.
- **About 1 reply in 8 was broken JSON** with good regions inside (for example
  `{"regions":[...]]}`, a stray bracket). The reply reader now recovers these;
  after the fix, 8 calls out of 8 on photo 1 gave a usable answer.
- A text-only test call answered in 535 ms. Checks with a picture finished
  within the 6 to 7 seconds the browser test waited; they were not timed more
  closely.

What this means: the road is reliable; neighbours' houses need a better
prompt (for example, telling the model the camera is on the owner's own front
door, so any building across the road belongs to someone else) or a stronger
model (`BEDROCK_MODEL_ID=us.amazon.nova-pro-v1:0`). Re-check with real
front-door photos before recording the demo.

### Doorbell-style photos (second round, same day)

Photos from Wikimedia Commons (credits in `ring-bird-journal-samples/web-photos/CREDITS.txt`
outside this repository), each 1024 px wide, three runs each unless stated:

| Photo | What Nova Lite marked | Consistency |
|---|---|---|
| A real Ring Video Doorbell 2 frame: front garden, road, houses opposite | Both groups of houses opposite, a parked car | Same boxes in 3 of 3 runs; one run missed the house on the right |
| A front-door view across a lawn to a street with three houses | All three houses, three cars, part of the road | Full answer in 1 run; the other 2 timed out (see below) |
| A church porch looking out on a churchyard (a check for false alarms) | The churchyard, as "neighbour", 29% of the frame | Same in 3 of 3 runs |

- Houses and cars across the road are found well in real doorbell-style
  views. Far-off houses are small, so most fall under the 1% size floor and
  only the biggest gets a suggested zone.
- The road is often missed or only partly boxed in these views.
- Anything beyond an opening tends to be called "neighbour", even when it is
  not a home, as in the churchyard.
- At 768 px and JPEG quality 70 (half the upload), the Ring frame came out
  better (both houses and all three cars) but the street view lost its houses
  in one run. Not enough runs to call it, so the app stays at 1024 px.

### Why some checks took up to a minute

From a home connection in the UAE, a 1024 px check took 7 to 58 seconds.
Bedrock's own `metrics.latencyMs` was about 1.1 seconds; the rest was the
upload. The connection was sending 13 to 21 KB per second to Bedrock and to an
unrelated test server alike, so the slowness is the connection, not AWS. The
old 15 second limit (set for the bird watcher) failed 2 of 3 checks on the
street view. The privacy check now waits up to 90 seconds and says on screen
that it can take up to a minute.

## Trying to improve the prompt (2026-10-17)

Four prompts were scored with `lib/privacy/eval.ts` on the photos in
`docs/test-photos` (12 expected areas across three doorbell-style views, plus
a churchyard where nothing should be called a neighbour), two runs each. The two
runs of a prompt nearly always matched, so each row is close to one sample per
photo. A later single run of the app's prompt found 9 of 12 (the Ring frame's
left-hand cars this time, but not the house on the right across the road), so
answers can still shift by an item between sessions.

| Prompt | Found (of 24) | False alarms | Ring frame | Street view | Across the road | Road |
|---|---|---|---|---|---|---|
| **App's prompt (kept)** | **17** | 2 | 6 of 8 | 8 of 10 | 3 of 6 | 4 of 6 |
| v1: long "doorbell on the owner's home" context, road as one full-width box, a do-not-mark list | 14 | 2 | 2 of 8 | 8 of 10 | 4 of 6 | 0 of 6 |
| v2: shorter doorbell context, original road wording | 12 | 2 | 2 of 8 | 8 of 10 | 2 of 6 | 0 of 6 |
| v3: app's prompt plus "a house on the far side of a road is never the owner's" | 14 | **0** | **8 of 8** | 4 of 10 | 2 of 6 | 0 of 6 |

- Describing the scene as a doorbell made Nova Lite list fewer things: houses
  stayed, roads and most cars went. The raw answers show single-box replies
  where the app's prompt gave four or five.
- v3 was the best on the real Ring frame and stopped the churchyard false
  alarm, but never found a road.
- The rule set before testing was to switch only if a prompt found more than
  the app's 17. None did, so the app's prompt is unchanged. Four photos are
  too few to prefer v3 on its strengths alone; more real doorbell frames
  would settle it.

## Choosing the model (2026-10-17)

Every vision model on Bedrock that this account could use was scored with
`lib/privacy/eval.ts` (the app's prompt, the four test photos, 12 expected
areas a run) and checked on the live Playground porch frame, where the right
answer is nothing or almost nothing. Claude models were listed but answered
"not available for this account".

| Model | Found, run 1 | Found, run 2 | False alarms (churchyard, 2 runs) | Live porch frame | 4 photos took |
|---|---|---|---|---|---|
| **Qwen3-VL 235B** (`qwen.qwen3-vl-235b-a22b`) | 9 of 9 (1 upload failed) | 11 of 12 | 0 | nothing (right) | 77 to 228 s |
| Nova Pro | 10 of 12 | 9 of 12 | 2 | 13% "neighbour" | 41 to 136 s |
| Nova 2 Lite | 8 of 12 | 8 of 12 | 0 | nothing (right) | 49 to 107 s |
| Nova Lite (the old default) | 8 of 12 | about 8.5 of 12 earlier | 1 to 2 | 77% "road", the owner's steps and parcel | 55 s |
| Pixtral Large | 5 of 12 | | 0 | | 103 s |
| Gemma 3 27B | 3 of 12 | | 2 | | 99 s |
| Llama 4 Maverick | 1 of 8 (1 failed) | | 1 | | 68 s |

Times depend mostly on the slow upload measured above, not the model.

**Chosen: Qwen3-VL**, the most accurate with no false alarms anywhere. It
runs on Amazon Bedrock like the others. Nova 2 Lite was the runner-up: also
no false alarms, but it often missed cars and the house straight across the
road. The bird journal keeps Nova Lite. `BEDROCK_MODEL_ID` still overrides the
model, so any of these can be tried again.

## The 93-photo benchmark (2026-10-17)

`lib/privacy/eval.ts` on `docs/test-photos/labels.json`: 93 photos, 78 with
213 labelled areas (110 houses, 55 vehicle groups, 48 roads) and 15 with
nothing to find, labelled by the rules in `docs/test-photos/LABELLING.md`.
Qwen3-VL, the app's prompt, two full runs. Raw answers and scores are in
`docs/benchmark/`.

| | Run 1 | Run 2 | 95% range (one run) |
|---|---|---|---|
| Areas found | 190 of 213, **89%** | 190 of 213, **89%** | 84 to 93% |
| Roads | 47 of 48, 98% | 47 of 48, 98% | 89 to 100% |
| Vehicles | 53 of 55, 96% | 53 of 55, 96% | 88 to 99% |
| Houses | 90 of 110, 82% | 90 of 110, 82% | 74 to 88% |
| Photos with every area found | 56 of 78, 72% | 56 of 78, 72% | 61 to 81% |
| Empty scenes marked anyway | 1 of 15, 7% | 1 of 15, 7% | 1 to 30% |

- **No call failed:** 186 of 186 answered with something usable.
- **The totals repeated exactly between runs**, though only 21 of 93
  individual answers were word for word the same.
- **Ranges are for one run.** The two runs use the same photos, so pooling
  them would make the ranges look narrower than they are.
- **The one false alarm** was the same photo both times (`bench/c153.jpg`, a
  back garden, marked as having a road).
- **Houses are the weak spot, with a pattern.** Of the 20 houses missed in
  run 1, 10 fill over 40% of the photo (a single house photographed close up),
  and every one of the 20 was missed in both runs. Our reading, not tested:
  a house that fills the frame looks like the owner's own, and the prompt says
  to leave out anything it cannot tell is someone else's. A real doorbell
  rarely sees a neighbour's house that close. Leaving those 10 out, 90 of the
  other 100 houses were found.
- 105 of 877 marks over both runs matched no labelled area. Some are likely
  real things the labels left out (small distant houses), so this is only a
  rough measure of false marks.
