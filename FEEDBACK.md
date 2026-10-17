# Product feedback

Notes from building Good Neighbour (and Ring Bird Journal, the app it grew
out of). Only things that were actually observed are listed. Sections will grow
once the app has been run against live services.

## Ring Developer Playground

- The "Simulate live view event" buttons (Package, Vehicle, Motion) each open a
  live video stream of stock footage. None of them sends a motion or package
  event, and Event History logs each one only as `on_demand`. The button labels
  suggest an event will be simulated, so this was confusing.
- The request shown for all three buttons is the same, so it is not clear from
  the page how an app can choose which clip its own stream receives.
- The token lasts 30 minutes, and the page clears it and re-locks steps 2 to 4
  when it expires. This interrupts testing. A longer-lived sandbox token, or a
  visible countdown, would help.
- After closing a stream, the buttons lock for about 20 seconds ("Event is
  still streaming"). The wait is not explained.
- The Playground worked from the UAE with no regional block.

## Ring API (devices, location, live stream)

- The development guide says only US-located devices are supported. It was not
  obvious up front that the sandbox camera is exempt from this.
- Privacy zones can be read (device configurations) but not created or
  edited: there is no write endpoint. An app that finds a privacy problem can
  only tell the owner how to fix it by hand. A way for an app to propose a
  zone, which the owner then approves in the Ring app, would make privacy
  tools like this one a single tap.
- The guide names the `privacy_zones` field and its `vertices` (0 to 1, origin
  top-left) but does not show where the field sits in the configurations
  reply, so the app has to search the whole reply for it. A full example reply
  would remove the guesswork.
- In the guide's sample reply, `privacy_zones` is empty, so there is no example
  of what a real zone looks like.

## ring-api-helloworld starter

- The live-stream code (the WHEP route and `useWebRTCStream`) worked as a base
  with no changes other than adding detection of a dropped connection: the
  hook never sets the stream inactive when the connection fails.
- The starter ships a video-processor plug-in system, MediaPipe and ONNX
  dependencies and a hand-tracking game. For an app that only needs the
  stream, these had to be removed first. A minimal "stream only" variant of
  the starter would be a faster starting point.
- `tsconfig.json` targets ES5, which is unusual for a Next.js 15 project.

## Amazon Bedrock (Nova Lite, API keys, Converse API)

Observed on 2026-10-17 while setting up a new AWS account in the UAE:

- Signing in offered "Builder ID" or "root user" with no hint that only the
  root user reaches the AWS console. Builder ID cannot make a Bedrock key.
- After sign-up, the console showed "Complete your account setup" and a free
  plan with "limited access to certain services", without saying whether
  Bedrock is one of them.
- The Bedrock console let a long-term API key be generated while the account
  was still being verified. The first call with it was refused with HTTP 403:
  "Your account is currently being verified. Verification normally takes less
  than 2 hours." Saying this on the API keys page, before the key is made,
  would save a confusing first failure.
- Amazon Nova models are documented as needing no separate access request; not yet confirmed here.

After verification (about an hour later), observed on 2026-10-17 with Nova
Lite through the Converse API:

- About 1 reply in 8 was not valid JSON even at temperature 0 and with a
  system prompt asking for "JSON only" in an exact shape. The fault was a
  stray closing bracket around otherwise good content. The app now recovers
  the regions, but a documented way to force a JSON schema in plain Converse
  replies (not only through tool use) would remove the guesswork.
- The same picture at temperature 0 did not always give the same answer: a
  house was marked in some runs and missed in others.
- Bounding boxes on the documented 0 to 1000 scale were accurate where given:
  the road's box matched the road's edge in the picture.

Ring's developer FAQ explains how TAKE encryption affects partner apps
clearly, but does not say whether the Developer Playground's sandbox camera
will ever be encrypted, or how a developer can test the encrypted-camera case.
A sandbox camera with TAKE switched on would let apps test it.
