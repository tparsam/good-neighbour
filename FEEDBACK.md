# Product feedback

Feedback on every Amazon tool Good Neighbour uses: the Ring Partner API and
Developer Playground, the `ring-api-helloworld` starter, and Amazon Bedrock.
Built and tested from the UAE between 6 and 17 October 2026.

**Rule for this file:** only things we observed are listed, each with the
request, reply or page text that showed it. Where something is our own
inference, it says so. The measurements behind the Bedrock points are in
`docs/findings.md`, and the code that works around each problem is linked.

---

## 1. Developer experience and onboarding

### Ring

**What worked.** From an empty folder to a live 1280 x 720 frame of the
sandbox camera in the browser took the starter's WHEP code almost unchanged.
The Playground generated a token in one click and worked from the UAE with no
regional block.

- **The Playground's 30-minute token is the biggest drag on testing.** When it
  expires, the page clears it and re-locks steps 2 to 4, and the app's calls
  start failing with 401. Nothing warns before that: during our first live
  test, a token pasted hours earlier had already expired, and the first sign
  was the failed call. A countdown on the page, or a longer-lived
  sandbox-only token, would remove most of this.
- **"Simulate live view event" does not simulate an event.** The Package,
  Vehicle and Motion buttons each open a live stream of stock footage, but no
  motion or package event is sent, and Event History logs each one only as
  `on_demand`. All three show the same request (a POST to the device's WHEP
  sessions endpoint), so it is not clear how an app chooses which clip its own
  stream gets. Our app's stream showed the porch-and-parcel clip.
- **The 20-second lock is unexplained.** After a stream closes, the buttons
  lock with "Event is still streaming. You can select a new event in 17s".
- **The sandbox camera reports `"online": false`** in `GET /v1/devices` while
  its live stream works. An app that checks `online` before offering a live
  view would wrongly hide the button.

### The `ring-api-helloworld` starter

- The WHEP route and `useWebRTCStream` hook were a sound base, but the hook
  never marks the stream inactive when the connection fails, so a dead stream
  looks alive. We added connection tracking
  (`lib/journal/connection.ts`).
- The starter ships a video-processor plug-in system, MediaPipe and ONNX
  dependencies and a hand-tracking game. An app that only needs the stream
  must remove these first. A minimal "stream only" variant would save that.
- `tsconfig.json` targets ES5, unusual for a Next.js 15 project.

### AWS (account and Bedrock setup)

Observed on 17 October 2026 with a brand-new AWS account:

- **Sign-in offers "Builder ID" or "root user"** with no hint that only the
  root user reaches the AWS console. Builder ID cannot create a Bedrock key.
- **The free plan's limits are not spelled out where they matter.** The
  console showed "Complete your account setup" and a free plan with "limited
  access to certain services", without saying whether Bedrock is one of them.
- **A key can be created before the account can use it.** The Bedrock console
  generated a long-term API key while the account was still being verified.
  The first call returned HTTP 403: "Your account is currently being verified.
  Verification normally takes less than 2 hours." The message itself is clear;
  showing it on the API keys page before the key is made would avoid a
  confusing first failure. It cleared in about an hour.

---

## 2. API and SDK functionality and limitations

### Ring Partner API

**What worked.** Device listing, device configurations and the WHEP live
stream all behaved as documented once reached. Configurations gave us exactly
what a privacy tool needs: the privacy zones, the motion zones and the
encryption flag in one call.

- **Privacy zones are read-only.** `GET /v1/devices/{id}/configurations`
  returns them, but there is no endpoint to create or change one. An app that
  finds a privacy gap can only tell the owner how to draw the zone by hand.
- **The API and the Ring app disagree on zone shape and count.** The API gives
  a zone as a polygon (`vertices`, 0 to 1 from the top-left), while Ring's
  help page says "You can make up to two Privacy Zones for each Ring device",
  drawn as a box. Neither limit appears in the API docs; we learned it from
  the consumer help page and now suggest at most the zones a camera has left
  (`lib/privacy/geometry.ts`).
- **A stream's end looks the same as a network fault.** The sandbox stream
  stays connected for about 20 seconds; then WebRTC reports `disconnected`
  with no other signal. An app cannot tell "the clip ended" from "the network
  dropped" and must guess with a timeout.
- **TAKE encryption blocks partner video, with no date for a fix.** Ring's FAQ
  says a TAKE device's "video requests return encrypted content, so your app
  cannot read recordings or snapshots, or open a live stream", and that
  partner access to the last 24 hours is being worked on, without a date.
  With TAKE rolling out as the default, any vision app needs a fallback; ours
  checks a screenshot the owner provides (`app/privacy/page.tsx`).

### Amazon Bedrock

**What worked very well.** The Converse API is the same for every model, so
comparing seven vision models (Amazon Nova Lite, Nova 2 Lite and Nova Pro,
Qwen3-VL, Llama 4 Maverick, Pixtral Large, Gemma 3) took one changed model
ID each. Bedrock's own `metrics.latencyMs` was about 1.1 s for a picture,
and the 0 to 1000 box format documented for Nova object detection was
followed by Qwen3-VL too.

- **The `byInputModality=IMAGE` filter on `ListFoundationModels` is ignored.**
  `GET /foundation-models?byInputModality=IMAGE` returned all 123 models, the
  same as no filter, and 54 of them list only `"TEXT"` in their own
  `inputModalities` (for example `openai.gpt-oss-120b-1:0`). Finding the
  vision models meant reading the whole list.
- **Listed models can be unusable, and the list does not say so.**
  `anthropic.claude-sonnet-5-5` and `anthropic.claude-haiku-5-5` are listed
  as `ACTIVE` with `["TEXT","IMAGE"]`, but every call returned HTTP 403:
  "... is not available for this account". The reason (plan, region or a
  sign-up step) was not given.
- **Nova Lite did not always return valid JSON.** About 1 reply in 8 broke
  the requested shape at temperature 0, with a stray closing bracket around
  correct content (`{"regions":[...]]}`). We recover the regions
  (`lib/privacy/regions.ts`), but plain Converse replies have no
  documented way to enforce a JSON schema; only tool use does.
- **Temperature 0 was not fully repeatable.** The same picture gave a house in
  one run and not in another.
- **Accuracy varied far more than the model names suggest.** On the
  Playground's own porch clip, almost all of it the owner's property, Nova
  Lite marked 77% of the frame as "road", the owner's steps and parcel
  included, while Nova 2 Lite and Qwen3-VL correctly marked nothing. Full
  scores are in `docs/findings.md`.

---

## 3. Documentation quality

- **Ring: show a full device-configurations reply with real zones.** The guide
  names `privacy_zones` and its `vertices` but not where the field sits, and
  its sample has `privacy_zones: []`. The live reply put it at
  `data.attributes.image_enhancements.privacy_zones`, next to
  `data.attributes.motion_detection.motion_zones` and
  `data.attributes.e2e_encryption.enabled`. One complete example with a zone
  in it would have saved writing a search over the whole reply
  (`lib/privacy/zones.ts`).
- **Ring: state the device limits in the API docs.** Two privacy zones per
  device, box-shaped in the app, and the models with no privacy zones at all
  (the help page lists Pan-Tilt Indoor Cam, Stick Up Cam with Pan-Tilt Mount,
  Stick Up Cam 1st Gen and Video Doorbell 1st Gen) belong next to the
  `privacy_zones` field.
- **Ring: say what the sandbox is exempt from.** The development guide says
  only US-located devices are supported; it was not obvious that the sandbox
  camera works from anywhere, as it did for us.
- **Ring: document how a stream ends.** A short diagram of a WHEP session's
  life (connect, how long the sandbox clip runs, what the app sees when it
  ends, when the Playground unlocks) would answer the questions above.
- **Ring: say whether the sandbox will ever have TAKE switched on,** and how a
  developer can test the encrypted-camera path before real users hit it.
- **Bedrock: put model access next to the model.** For each listed model, say
  whether this account can call it and, if not, why.

---

## 4. Future feature requests

- **Because** privacy zones are read-only, **Ring should build** a "propose
  privacy zone" endpoint that the owner approves in the Ring app with one tap,
  **to enable** privacy tools that fix the problem instead of describing it.
- **Because** a stream ending looks identical to a dropped connection,
  **Ring should send** an explicit end-of-stream signal (a session-closed
  event or a WHEP status call), **to enable** apps to reconnect after a
  real drop and stop cleanly at a real end.
- **Because** TAKE hides video from partner apps with no date for access,
  **Ring should build** a sandbox camera with TAKE on, and a dated plan for
  the 24-hour access, **to enable** developers to ship encrypted-camera
  handling that has been tested, not guessed.
- **Because** the 30-minute token interrupts every test session, **Ring should
  offer** a longer-lived sandbox-only token, or refresh in the Playground,
  **to enable** test runs and demo recordings without re-pasting secrets.
- **Because** the Playground's three clips all go through the same request,
  **Ring should let** a stream request name its clip (porch, driveway,
  garden), **to enable** apps to test each scene their users will have.
- **Because** `byInputModality` is ignored and unusable models are listed as
  active, **Bedrock should** honour the filter and add a per-account
  "available to you" flag to `ListFoundationModels`, **to enable** apps to
  pick a working vision model automatically.
- **Because** structured output in plain Converse replies is not enforced,
  **Bedrock should** offer a JSON-schema option on Converse for every model,
  **to enable** apps to drop repair code like ours.
