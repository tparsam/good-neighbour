# Friction log: Good Neighbour

Friction met while building Good Neighbour for the Build, Ship, Shape: Amazon
Developer Hackathon 2026 (Ring track), 6 to 18 October 2026. Each entry gives
the task, the steps, what was expected and what happened, a severity, the
workaround and a suggestion. The evidence behind each is in
[`FEEDBACK.md`](../FEEDBACK.md).

Severity: **High** (security or blocks the task), **Medium** (costs real
time or needs a workaround in code), **Low** (an annoyance).

## 1. Starter: the DELETE route sends the Ring token to any URL.
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

## 2. Starter: a dead stream looks alive.
- Task: show the owner when the live view has stopped.
- Steps: start a sandbox stream and wait for the clip to end (about 20 s).
- Expected: the hook reports the stream as inactive.
- Actual: the video freezes and the hook still says the stream is active.
- Severity: Medium.
- Workaround: watch `connectionState`, allow 5 s to recover, then tear down
  (`lib/ring/connection.ts`).
- Suggestion: handle `disconnected` and `failed` in the starter's hook.

## 3. Ring: where are the privacy zones?
- Task: read a camera's existing privacy zones.
- Steps: read the guide's `privacy_zones` section; call
  `GET /v1/devices/{id}/configurations`.
- Expected: the docs show the field's path in the reply.
- Actual: the sample has `privacy_zones: []` and no path; the live reply put
  it at `data.attributes.image_enhancements.privacy_zones`.
- Severity: Medium.
- Workaround: search the whole reply for the field (`lib/privacy/zones.ts`).
- Suggestion: one complete sample reply with a real zone.

## 4. Ring: the sandbox camera says it is offline.
- Task: offer a live view only for online cameras.
- Steps: `GET /v1/devices` with a Playground token.
- Expected: the sandbox camera, whose stream works, reports `online: true`.
- Actual: `"online": false`.
- Severity: Low (an app that trusts the flag hides the live view).
- Workaround: ignore the flag and try the stream.
- Suggestion: report the sandbox camera as online.

## 5. Ring: the 30-minute token runs out mid-test.
- Task: test the live check repeatedly.
- Steps: paste a Playground token into the app; come back later.
- Expected: a warning before it expires.
- Actual: the next call fails with 401 and nothing warned.
- Severity: Medium.
- Workaround: clear "paste a new token" messages, and a token field on the
  page so no restart is needed.
- Suggestion: a countdown in the Playground, or a longer sandbox-only token.

## 6. Bedrock: the image filter is ignored.
- Task: list the vision models we could use.
- Steps: `GET /foundation-models?byInputModality=IMAGE`.
- Expected: only models that take images.
- Actual: all 123 models, 54 of them text-only by their own
  `inputModalities`.
- Severity: Low.
- Workaround: filter the full list ourselves.
- Suggestion: honour the filter.

## 7. Bedrock: listed models refuse the account.
- Task: include Claude in the model comparison.
- Steps: call `anthropic.claude-sonnet-5-5` and `anthropic.claude-haiku-5-5`,
  listed as `ACTIVE` with `["TEXT","IMAGE"]`.
- Expected: an answer, or a reason it is unavailable.
- Actual: HTTP 403 "... is not available for this account", no reason given.
- Severity: Medium.
- Workaround: compared the seven models that answered.
- Suggestion: a per-account availability flag in the model list.

## 8. AWS: a key that cannot be used yet.
- Task: first Bedrock call on a new account.
- Steps: create a long-term Bedrock API key; call Converse.
- Expected: the key works, or the console says it will not yet.
- Actual: HTTP 403 "Your account is currently being verified"; it cleared in
  about an hour.
- Severity: Low.
- Workaround: wait.
- Suggestion: show the verification notice on the API keys page.

## 9. Bedrock: broken JSON from Nova Lite.
- Task: get the regions as JSON at temperature 0.
- Steps: the same prompt on our test photos.
- Expected: valid JSON every time.
- Actual: about 1 reply in 8 had a stray bracket around correct content
  (`{"regions":[...]]}`).
- Severity: Medium.
- Workaround: recover each complete region from the text
  (`lib/privacy/regions.ts`).
- Suggestion: a JSON-schema option on Converse.

