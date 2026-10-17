# Demo video script: Good Neighbour (target 2:50, hard limit under 3:00)

Status: draft. Timings are planned, not measured, and the live result depends
on which Playground clip the stream shows. After the first real run, replace
the bracketed figures with what the screen actually showed, and record the clip
and the result in `docs/findings.md`.

Hackathon rules this video must meet: under 3 minutes, public on YouTube or
Vimeo, in English, and showing the project working on the Ring simulator or a
real device.

| Time | On screen | Say |
|---|---|---|
| 0:00 | The page at rest: "Good Neighbour" arched over the oval, the drawn sample scene inside, "Sample result" at the top | A Ring doorbell sees more than your home. It sees the street, and the house across the road. |
| 0:12 | Hold on the sample; pointer traces the road and the house opposite | Ring lets you hide those parts with privacy zones, but you have to notice the problem and draw every zone yourself. Most people never do. |
| 0:25 | Press **Start live stream**; the oval fills with the Playground clip | Good Neighbour does the noticing for you. This is Ring's own sandbox camera, streamed through the Ring API. Nothing here is mocked. |
| 0:40 | Press **Check this view**; the button reads "Checking" | One frame goes to Qwen3-VL on Amazon Bedrock, which marks what is not yours: the road, neighbours' houses, vehicles on the street. At the same time, the app reads the camera's existing privacy zones from the Ring API. |
| 1:00 | The curved line under the oval changes to "[N]% of this view is not yours and is still recorded" | The answer, in one line. |
| 1:10 | Scroll to **Findings** | How much of the view is not yours, how much is already hidden, and how many zones it suggests. |
| 1:22 | Scroll to **Zones**; pause on the marked frame and the legend | Hatched is not yours. Solid is already hidden by a zone you have. A dashed outline is a zone it suggests. |
| 1:40 | Press **Show what would be recorded** | And this is what the camera would record once you add them. |
| 1:52 | Press **Show the survey**; scroll to the suggested zones and **To apply a zone** | Each suggestion comes with where it sits and how to add it in the Ring app. Ring does not let apps change zones, so you stay in charge. And it never claims to know where your property ends. These are suggestions, not verdicts. |
| 2:12 | Scroll to the top; press **Check a photo** and choose a screenshot of a front-door view | Ring's new encryption hides camera video from apps. Good Neighbour still works: take a screenshot in the Ring app and check that. Your zones are still read. |
| 2:28 | Switch the system to dark mode, then narrow the window to phone width | Light and dark, desktop and phone. |
| 2:35 | Terminal: `npm test` passing; then the README | Open source under MIT, tested, with a hard cap on how many pictures it will send to the AI. |
| 2:45 | Back to the page, the finding line in view | Good Neighbour. Is your camera being a good neighbour? |

## If the live check finds nothing

The Playground's clips are stock footage (birds at a feeder, a porch with a
parcel, a driveway), and it is not yet known which one the app's stream will
show. If the check honestly finds nothing that is not the owner's:

- Keep it in. At 1:00 say: "In this view everything is the owner's, and it
  says so instead of inventing a problem." The page shows "Nothing outside your
  property was found in this view."
- Then, at 1:10, press **Check a photo** with a real photo of a street taken
  from a front door, and say: "Here is the same check on a real front-door
  view." Go on from 1:22 with that result. Drop the 2:12 beat, since the photo
  button has already been shown.

Never present the sample result as a live result.

## Before recording

- [ ] Bedrock answers: the probe has run on at least one photo without error.
- [ ] A fresh Ring Playground token in `.env.local` (it lasts 30 minutes, so
      get it right before recording), then restart `npm run dev`. A restart
      also resets the check limit.
- [ ] Do one rehearsal check, then reload the page so the recording starts on
      the sample.
- [ ] Browser at 1440 x 900, zoom 100%, bookmarks bar hidden, no other tabs.
- [ ] System theme set to light for the start.
- [ ] Notifications off (Do Not Disturb).
- [ ] Record with QuickTime (File, New Screen Recording) or Cmd+Shift+5.
- [ ] Terminal ready in a second window with `npm test` typed in, and the
      README open.
- [ ] A front-door photo or Ring-app screenshot ready on the Desktop for
      **Check a photo**. Check it once beforehand: the model's answers can vary,
      so pick a photo where it marks both the road and the house opposite.

## After recording

- [ ] Length under 3:00.
- [ ] Upload to YouTube as **Public**, in English. Title: "Good Neighbour: Is
      your Ring camera being a good neighbour?"
- [ ] Paste the link into the Devpost submission.
- [ ] Replace the bracketed figures above with the real ones, and note the
      clip and result in `docs/findings.md`.
