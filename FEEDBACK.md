# Product feedback

Notes from building Ring Bird Journal. Only things that were actually observed
are listed. Sections will grow once the app has been run against live services.

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
- Nothing further to report until the app has been run with a live token.

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

Nothing to report yet. The Bedrock call is written against the documented
Converse API and API-key authentication but has not been run.
