# Devpost submission: Good Neighbour

Everything the submission form asks for, ready to paste, plus a checklist of
the hackathon's rules. Rules quoted from
https://amazonappdev2026.devpost.com/rules (read 18 October 2026).

**Deadline: Friday 23 October 2026, 12:00 pm Pacific Time** (11:00 pm on 23
October in the UAE). Drafts can be saved on Devpost before then; nothing can
change after it.

**Judging: 9 to 20 November 2026.** The rules say the project must stay
available "free of charge and without any restriction, for testing,
evaluation and use by the Sponsor, Administrator and Judges until the Judging
Period ends", so the hosted copy and its Bedrock key must work until at least
20 November.

## Checklist

| Rule | Where it is met | Status |
|---|---|---|
| Ring track: a working app using Ring APIs, shown on a simulator or a real device | Ring API device list, configurations and WHEP live stream, called at runtime in `app/api/ring/`; the video shows the Playground's sandbox camera | Done |
| Text description of features and functionality | "Description" below | Paste |
| Public GitHub repo with all source, assets and setup and run instructions | https://github.com/tparsam/good-neighbour, README "Run it" | Done |
| Open source licence visible in the repo's About section | MIT, detected by GitHub | Done |
| Demo video under 3 minutes, public on YouTube or Vimeo, English, showing it working on the device | `docs/demo-script.md` (about 2:45) | **To record** |
| No third-party trademarks or copyrighted music without permission | Script has no music; the doorbell photo is CC BY-SA and credited | Keep it that way |
| Product feedback for each tool, API and SDK (five questions) | "Product feedback" below; full detail in `FEEDBACK.md`, with a five-line summary at its top | Paste |
| Primary track named | Ring | Pick on the form |
| Mini challenges named | AWS Builder; Open Source if the contribution below is made | Pick on the form |
| AWS Builder: AWS services and how they were used | "AWS Builder: which AWS services, and how" below (also summarised under Product feedback) | Paste |
| Open Source: contribution URL, project repo URL, GitHub username, what, how, why | "Open Source mini challenge" below; pull request opened 18 October 2026 | Paste |
| Judges can test it free until judging ends | Hosted copy, sample photos, token field; "Testing instructions" below | **Replace the Bedrock key:** the hosted key expires 16 November, the local one 17 November, judging ends 20 November |
| Optional: feature requests with priority | "Feature requests" below | Paste |
| Optional: friction log (up to 10% bonus) | "Friction log" below | Paste |

## The form, field by field

Every field, in the order Devpost asks, and where its answer is in this
file.

| Devpost field | Answer |
|---|---|
| Project name | Good Neighbour |
| Elevator pitch | "Basics" below |
| Thumbnail | `docs/devpost-thumbnail.png` |
| About the project | "Description" below (Inspiration to What's next) |
| Built with | "Basics" below |
| "Try it out" links | the hosted copy and the GitHub repo, "Basics" below |
| Image gallery | "Image gallery" below |
| Video demo link | the YouTube link |
| Code repository URL | https://github.com/tparsam/good-neighbour |
| Primary track | Ring |
| Mini challenges | AWS Builder and Open Source |
| AWS Builder: which AWS services, and how | "AWS Builder: which AWS services, and how" below |
| Testing instructions | "Testing instructions" below |
| Product feedback (and the AWS services used) | "Product feedback" below |
| Did the project exist before the hackathon? | "New or existing" below |
| Open Source fields | "Open Source mini challenge" below |
| Feature requests (optional) | "Feature requests" below |
| Friction log (optional, up to 10% bonus) | The form asks for a link: https://github.com/tparsam/good-neighbour/blob/main/docs/friction-log.md (the same entries as "Friction log" below) |

If the form asks a question that is not listed here, its answer is probably
in one of these sections; otherwise keep it short and factual.

## New or existing

New. Good Neighbour was started and built during the submission period,
from 6 October 2026. Its live-stream code comes from Amazon's open-source
`ring-api-helloworld` starter (MIT licence, credited in the README); the
privacy check, the Bedrock integration and model benchmark, the zone
geometry and suggestions, the encrypted-camera handling, the pasted-token
hosting, the design and the tests were all written during the hackathon.
The repository's commit history shows every step.

## Image gallery

In `docs/gallery/`, taken from the hosted copy on 18 October 2026 with the
sample doorbell photo. Upload them in this order, with these captions:

1. `1-result.png`: "One check: 5% of this Ring doorbell's view is not the
   owner's and is still recorded."
2. `2-findings.png`: "Findings in plain words: how much is not yours, how
   much is hidden, how much would still be recorded."
3. `3-zones.png`: "The survey: hatched is not yours; dashed outlines are the
   two suggested privacy zones."
4. `4-suggested-zones.png`: "Each suggested zone, cut from the picture, with
   its corners and the steps to add it in the Ring app."
5. `5-phone-dark.png`: "On a phone, in dark mode."

Credit, in the gallery or the description: doorbell photo "Ring Video
Doorbell 2 capture" by Amin, CC BY-SA 4.0, via Wikimedia Commons. Every
screenshot shows that photo, so the credit is needed.

## Basics

- **Project name:** Good Neighbour
- **Elevator pitch:** Is your Ring camera being a good neighbour? It finds
  what your camera records that is not yours, checks your privacy zones, and
  suggests the ones to add.
- **Primary track:** Ring
- **Mini challenges:** AWS Builder; Open Source
- **Code repository:** https://github.com/tparsam/good-neighbour
- **Try it:** https://good-neighbour-delta.vercel.app
- **Video:** (the YouTube link)
- **Built with:** next.js, react, typescript, webrtc, ring-api, amazon-bedrock,
  qwen3-vl, vercel, node.js

## Description

### Inspiration

A Ring doorbell sees more than its owner's home. It sees the pavement, the
street, and the house across the road. Ring lets owners hide those parts with
privacy zones, but they have to notice the problem and draw every zone by
hand, and most never do. It matters: in 2021 a UK court ([*Fairhurst v
Woodard*](https://inforrm.org/2021/10/20/case-law-fairhurst-v-woodard-neighbour-cctv-harassment-and-data-protection-claim-succeeds-percy-preston/), Oxford County Court) found that a homeowner whose Ring doorbell and
cameras recorded his neighbour's home had breached UK data protection law,
and treated him as a data controller. We wanted a tool that respects the
neighbours as much as the owner: a non-security use of a security camera.

### What it does

Good Neighbour looks at what the camera actually sees and answers one
question: how much of this view is not yours, and is it still being recorded?

1. It plays the camera's live stream in the browser through the Ring API
   (WHEP), or takes a photo or screenshot the owner chooses.
2. On **Check this view**, one frame goes to Qwen3-VL on Amazon Bedrock, which
   marks three kinds of area that are not the owner's: road (street or
   pavement), neighbour (another household's building, door, window, garden
   or driveway) and vehicle (on the public road).
3. At the same time, it reads the camera's existing privacy zones and its
   encryption setting from the Ring API.
4. It measures how much of the view is not the owner's, how much of that is
   already hidden, and how much is still recorded.
5. It suggests at most the privacy zones the camera has left (Ring allows two
   per camera), placed to hide as much as possible, with their corners, a
   preview of what would still be recorded, and the steps to add them in the
   Ring app.

It is honest about its limits. It never claims to know where a property
ends, so it calls its zones suggestions. A failed check is never shown as a
clean result. Cameras with Ring's new TAKE encryption, whose video apps
cannot see, are detected and the owner is asked for a screenshot instead. It
stores nothing.

### How we built it

- **Next.js 15 and React**, with API routes as a thin server between the
  browser, the Ring API and Bedrock. We started from Amazon's
  `ring-api-helloworld` starter for the live stream (credited in the README)
  and built everything else during the hackathon.
- **Ring API:** device discovery, device configurations (privacy zones,
  motion zones and the `e2e_encryption` flag) and the WHEP live stream.
  The hosted copy has no Ring account of its own: a visitor pastes a Ring
  access token, which stays in their browser tab and is used only to call
  Ring.
- **Amazon Bedrock:** the Converse API with API-key authentication. We scored
  seven vision models (Amazon Nova Lite, Nova 2 Lite and Nova Pro, Qwen3-VL,
  Llama 4 Maverick, Pixtral Large and Gemma 3) with our own evaluation
  script, then built a 93-photo labelled benchmark for the winner.
- **Geometry in plain TypeScript:** model boxes (0 to 1000) and Ring polygons
  (0 to 1) are compared on a grid $G$ of $100 \times 100$ points, each tested
  against the zones with ray casting. With $N$ the areas that are not the
  owner's and $Z$ the privacy zones, the headline figure is

  $$\text{still recorded} = \frac{|\{\, p \in G : p \in N,\ p \notin Z \,\}|}{|G|}$$

  A small search then picks the zones that hide the most within Ring's limit
  of two.
- **Tested:** 128 tests cover the geometry, the reader for the model's reply
  (including broken JSON), the reader for Ring's zones and encryption flag,
  the pasted-token checks, and that the docs only name files that exist.
- **Hosted on Vercel**, with a per-visitor limit and a hard cap on Bedrock
  calls so a public copy cannot run up costs.

### Challenges we ran into

- **Ring's privacy zones are read-only**, so the app cannot fix the problem it
  finds. We turned that into a design choice: the owner stays in charge and
  draws each zone, guided by the app.
- **Where the zones live was undocumented.** The guide names `privacy_zones`
  but not its place in the reply; we found it at
  `data.attributes.image_enhancements.privacy_zones` on a live camera.
- **Model accuracy varied hugely.** On Ring's own sandbox porch, Nova Lite
  marked 77% of the owner's steps and parcel as "road"; Qwen3-VL correctly
  marked nothing. Measuring before choosing mattered more than the prompt.
- **TAKE encryption** became Ring's default during the hackathon and hides
  live video from apps, so we added the screenshot path.
- **The sandbox stream ends after about 20 seconds** and looks exactly like a
  network fault; we learned to tell them apart from the connection log.

### Accomplishments we're proud of

- On 93 labelled photos it finds 89% of what is not the owner's (95% range
  84 to 93%): 98% of roads, 96% of vehicles and 82% of houses, with the same
  totals on a second run.
- The live check works end to end on the hosted copy, with any Ring
  developer's own camera.
- A calm design that reports and suggests rather than accuses, in light and
  dark, on desktop and phone.

### What we learned

Vision models are good at roads and cars and weaker at houses, especially a
house that fills the frame, which may look like the owner's own. Saying "I
don't know" clearly is part of the product: "no usable answer" and "nothing
found" must never look the same.

### What's next for Good Neighbour

- A Ring "propose a privacy zone" endpoint, so the owner could approve a
  suggestion with one tap instead of drawing it.
- Checking every camera on an account, and re-checking when a camera is moved.
- Reading encrypted cameras once Ring gives partner apps access to them.
- Better house detection, tested on more real doorbell frames.

## Testing instructions

1. Open https://good-neighbour-delta.vercel.app. No sign-in is needed.
2. Press a sample photo (**A Ring doorbell**, **A front door**, **Across the
   road**), or **Check a photo** with any picture of a view from a front door.
   A check takes a few seconds to a minute, mostly the upload.
3. To see the live camera: sign in to the
   [Ring Developer Playground](https://developer.amazon.com/ring/console/playground),
   copy an access token (it lasts 30 minutes), paste it into **Ring access
   token** on the page and press **Connect camera**. Then press **Start live
   stream** and, within 10 seconds of the video appearing (the sandbox clip
   lasts about 20), **Check this view**. The sandbox porch is all the
   owner's, so the right answer is "Nothing found".
4. Each visitor can run 10 checks an hour on the hosted copy.
5. To run it yourself: the README's "Run it" section (Node.js 24, a Ring
   developer token and an Amazon Bedrock API key).

## Product feedback

Full detail, with the request or page text behind each point, is in
[`FEEDBACK.md`](../FEEDBACK.md).

### Which developer tools, APIs and SDKs did you use, and for what?

- **Ring Partner API:** `GET /v1/devices` to find the camera,
  `GET /v1/devices/{id}/configurations` for its privacy zones and encryption
  flag, and the WHEP live-view endpoint for the stream.
- **Ring Developer Playground:** access tokens and the sandbox camera for all
  testing and the demo.
- **`ring-api-helloworld` starter:** the base for the WHEP route and the
  WebRTC hook.
- **Amazon Bedrock (AWS Builder):** the Converse API, called from
  `lib/privacy/bedrock.ts` with a Bedrock API key (bearer token) in
  `us-east-1`. Qwen3-VL (`qwen.qwen3-vl-235b-a22b`) reads each frame and
  returns boxes for road, neighbour and vehicle as JSON at temperature 0. The
  same Converse call let us compare seven vision models by changing only the
  model ID, and our evaluation script (`lib/privacy/eval.ts`) and 93-photo
  benchmark run through it too. A check gives up after 90 seconds, retries a
  slow connect once, and stops at a per-run cap.
- **Vercel:** hosting the public copy.

### What worked well?

- **Ring:** from an empty folder to a live 1280 x 720 frame of the sandbox
  camera took the starter's WHEP code almost unchanged. One configurations
  call gave everything a privacy tool needs: privacy zones, motion zones and
  the encryption flag. The Playground worked from the UAE with no regional
  block.
- **Bedrock:** one API for every model made a fair seven-model comparison
  quick. Bedrock's own latency was about 1.1 seconds per picture, and the
  documented 0 to 1000 box format was followed by Qwen3-VL as well as Nova.
  Over two full benchmark runs, 186 of 186 calls answered.

### What needs work?

- **Ring:** privacy zones are read-only; the place of `privacy_zones` in the
  configurations reply is not documented; the two-zone limit is only on a
  consumer help page; the sandbox camera reports `"online": false` while its
  stream works; a stream's end looks the same as a dropped connection; TAKE
  encryption blocks partner video with no date for access.
- **Starter:** the stream hook never marks a failed connection as inactive,
  and the DELETE route sends the server's Ring token to any session URL the
  browser supplies (see the friction log, and the fix in
  https://github.com/AmazonAppDev/ring-api-helloworld/pull/40).
- **Bedrock:** the `byInputModality=IMAGE` filter is ignored; models listed
  as `ACTIVE` with image input can answer "not available for this account"
  with no reason; plain Converse replies cannot enforce a JSON schema (Nova
  Lite broke the JSON in about 1 reply in 8); temperature 0 was not fully
  repeatable.

### How was your onboarding experience (zero to hello world)?

Ring was fast: the starter's WHEP code gave a live sandbox frame almost
unchanged, and the Playground made a token in one click. The surprise was
that the token lasts only 30 minutes. AWS was slower: the sign-in page
offers "Builder ID" or "root user" without saying only the root user reaches
the console, and a brand-new account's first Bedrock call returned 403 ("Your
account is currently being verified") for about an hour, after the console
had already issued the key.

### Would you build with these devices and services again?

Yes, for a new idea. Good Neighbour itself is finished: it covers everything
I set out to build.

## AWS Builder: which AWS services, and how

**Amazon Bedrock** does the core of Good Neighbour: deciding which parts of a
camera's view are not the owner's.

- **Converse API, called directly.** The Next.js server route
  (`app/api/privacy/route.ts`) calls Bedrock's Converse endpoint in
  `us-east-1` over HTTPS (`lib/privacy/bedrock.ts`), authenticated with a
  Bedrock API key (bearer token). No SDK is needed: one request per check.
- **Model: Qwen3-VL 235B on Bedrock** (`qwen.qwen3-vl-235b-a22b`). Each check
  sends one JPEG, at most 1024 px wide, with a system prompt
  (`lib/privacy/bedrock.ts`) at temperature 0. The model answers with JSON
  boxes for road, neighbour and vehicle on the 0 to 1000 scale AWS documents
  for Nova object detection. `lib/privacy/regions.ts` reads the reply and
  recovers regions from broken JSON; a reply with no readable region is
  reported as "no usable answer", never as "nothing found".
- **Model chosen by measurement.** Because Converse is the same for every
  model, we scored seven Bedrock vision models (Nova Lite, Nova 2 Lite, Nova
  Pro, Qwen3-VL, Llama 4 Maverick, Pixtral Large, Gemma 3) with our own
  scorecard (`lib/privacy/eval.ts`), changing only the model ID. The winner
  was then measured on 93 labelled photos: 89% of areas found (95% range 84
  to 93%), 98% of roads, 96% of vehicles, 82% of houses; raw answers are in
  `docs/benchmark/`. `ListFoundationModels` was used to find the vision
  models.
- **Safe to host publicly.** The route accepts only images under 2 million
  base64 characters, gives up on a check after 90 seconds, retries a slow
  connect once, stops after a per-run cap (`MAX_FRAMES_PER_RUN`) and allows
  each visitor 10 checks an hour. The hosted copy has its own Bedrock key.

## Feature requests

| Request | Why it matters to this project | Priority |
|---|---|---|
| Ring: an endpoint to propose a privacy zone that the owner approves in the Ring app | The app finds the gap but can only describe the fix | Critical |
| Ring: a sandbox camera with TAKE on, and a date for partner access to encrypted video | TAKE is the default now; the encrypted path could not be tested | Critical |
| Ring: an explicit end-of-stream signal for WHEP sessions | A clip ending and a network drop look identical | Important |
| Ring: a longer-lived sandbox-only token, or refresh in the Playground | The 30-minute token interrupts every test and demo | Important |
| Ring: document where `privacy_zones` sits, with a full sample reply, and the per-device limits | Saved hours of searching the reply | Important |
| Ring: let a stream request choose the Playground clip | To test porch, driveway and garden scenes on purpose | Nice-to-have |
| Bedrock: honour `byInputModality` and flag models this account can use | Finding a working vision model meant reading 123 entries and hitting 403s | Important |
| Bedrock: a JSON-schema option on Converse for every model | Removes repair code for broken JSON | Important |

## Friction log

**1. Starter: the DELETE route sends the Ring token to any URL.**
- Task: close a live-view session from the browser.
- Steps: `useWebRTCStream` posts `{ sessionUrl }` to `DELETE /api/ring/stream`,
  which calls `fetch(sessionUrl, { headers: { Authorization: Bearer <token> } })`.
- Expected: the token only ever goes to Ring's API.
- Actual: the server sends its Ring token to whatever address the request
  body names, so any page or script that can reach the route can collect it.
- Severity: High (credential leak).
- Workaround: accept only `https://api.amazonvision.com` URLs with no user
  info (`ringSessionUrl` in `lib/ring/ring-session.ts`, with tests).
- Suggestion: validate the session URL in the starter; done in
  https://github.com/AmazonAppDev/ring-api-helloworld/pull/40.

**2. Starter: a dead stream looks alive.**
- Task: show the owner when the live view has stopped.
- Steps: start a sandbox stream and wait for the clip to end (about 20 s).
- Expected: the hook reports the stream as inactive.
- Actual: the video freezes and the hook still says the stream is active.
- Severity: Medium.
- Workaround: watch `connectionState`, allow 5 s to recover, then tear down
  (`lib/ring/connection.ts`).
- Suggestion: handle `disconnected` and `failed` in the starter's hook.

**3. Ring: where are the privacy zones?**
- Task: read a camera's existing privacy zones.
- Steps: read the guide's `privacy_zones` section; call
  `GET /v1/devices/{id}/configurations`.
- Expected: the docs show the field's path in the reply.
- Actual: the sample has `privacy_zones: []` and no path; the live reply put
  it at `data.attributes.image_enhancements.privacy_zones`.
- Severity: Medium.
- Workaround: search the whole reply for the field (`lib/privacy/zones.ts`).
- Suggestion: one complete sample reply with a real zone.

**4. Ring: the sandbox camera says it is offline.**
- Task: offer a live view only for online cameras.
- Steps: `GET /v1/devices` with a Playground token.
- Expected: the sandbox camera, whose stream works, reports `online: true`.
- Actual: `"online": false`.
- Severity: Low (an app that trusts the flag hides the live view).
- Workaround: ignore the flag and try the stream.
- Suggestion: report the sandbox camera as online.

**5. Ring: the 30-minute token runs out mid-test.**
- Task: test the live check repeatedly.
- Steps: paste a Playground token into the app; come back later.
- Expected: a warning before it expires.
- Actual: the next call fails with 401 and nothing warned.
- Severity: Medium.
- Workaround: clear "paste a new token" messages, and a token field on the
  page so no restart is needed.
- Suggestion: a countdown in the Playground, or a longer sandbox-only token.

**6. Bedrock: the image filter is ignored.**
- Task: list the vision models we could use.
- Steps: `GET /foundation-models?byInputModality=IMAGE`.
- Expected: only models that take images.
- Actual: all 123 models, 54 of them text-only by their own
  `inputModalities`.
- Severity: Low.
- Workaround: filter the full list ourselves.
- Suggestion: honour the filter.

**7. Bedrock: listed models refuse the account.**
- Task: include Claude in the model comparison.
- Steps: call `anthropic.claude-sonnet-5-5` and `anthropic.claude-haiku-5-5`,
  listed as `ACTIVE` with `["TEXT","IMAGE"]`.
- Expected: an answer, or a reason it is unavailable.
- Actual: HTTP 403 "... is not available for this account", no reason given.
- Severity: Medium.
- Workaround: compared the seven models that answered.
- Suggestion: a per-account availability flag in the model list.

**8. AWS: a key that cannot be used yet.**
- Task: first Bedrock call on a new account.
- Steps: create a long-term Bedrock API key; call Converse.
- Expected: the key works, or the console says it will not yet.
- Actual: HTTP 403 "Your account is currently being verified"; it cleared in
  about an hour.
- Severity: Low.
- Workaround: wait.
- Suggestion: show the verification notice on the API keys page.

**9. Bedrock: broken JSON from Nova Lite.**
- Task: get the regions as JSON at temperature 0.
- Steps: the same prompt on our test photos.
- Expected: valid JSON every time.
- Actual: about 1 reply in 8 had a stray bracket around correct content
  (`{"regions":[...]]}`).
- Severity: Medium.
- Workaround: recover each complete region from the text
  (`lib/privacy/regions.ts`).
- Suggestion: a JSON-schema option on Converse.

## Open Source mini challenge

The rules ask for "a new, additional open-source project or contribution to
an existing public repository during the hackathon window", with the
contribution URL, the project repository URL, the GitHub username, and what
was done, how it works and why it matters.

- **Contribution URL:** https://github.com/AmazonAppDev/ring-api-helloworld/pull/40
  (from the fork https://github.com/tparsam/ring-api-helloworld, branch
  `fix/session-url-token-leak`)
- **Project repository URL:** https://github.com/tparsam/good-neighbour
- **GitHub username:** tparsam
- **What I did:** fixed a credential leak in Amazon's `ring-api-helloworld`
  starter, the base most Ring track apps begin from. Its
  `DELETE /api/ring/stream` route closed a live-view session by fetching
  whatever `sessionUrl` the request named, with the server's Ring access
  token attached, so anything that could reach the route could send the
  token to its own server.
- **How it works:** a new `ringSessionUrl()` helper accepts only addresses on
  `https://api.amazonvision.com` with no user info (relative paths resolve
  against it), and the route answers 400 for anything else. The device ID in
  the WHEP URL is now encoded so it cannot change the path. Tests use Node's
  built-in runner (`npm test`, no new dependencies) and cover look-alike
  hosts, `http:`, user-info tricks, `javascript:` and bad input.
- **Why it matters:** every app built on the starter inherits the route, and
  hosted copies expose it to the internet. The fix runs in Good Neighbour,
  which found the problem while building on the starter (friction log entry
  1).
