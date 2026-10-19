# Demo video script: Good Neighbour (target 2:50, hard limit under 3:00)

Hackathon rules this video must meet: under 3 minutes, public on YouTube or
Vimeo, in English, and showing the project working on the Ring simulator or a
real device.

**What you will show, in one breath:** the hosted copy at
https://good-neighbour-delta.vercel.app, connected to the live Ring sandbox
camera by pasting a Ring token (its porch clip, which is all the owner's, so
the right answer is "nothing"), then
a real Ring doorbell photo of a street (where it finds houses, road and cars
and suggests two zones). Everything on screen is real; nothing is mocked.

**What happened when this was rehearsed on 17 October 2026:**
- The live stream started about 3.5 s after pressing Start and ran for about
  20 s before the sandbox clip ended. Press **Check this view** within 10 s
  of the video appearing.
- The porch clip: Qwen3-VL marked nothing, which is right.
- `docs/test-photos/ring-doorbell-frame.jpg`: about 5% of the view not yours,
  2 zones suggested (the houses opposite; the road and its cars).
- On 18 October 2026 the same run worked on the hosted copy with a pasted
  token: video in a few seconds, the porch clip checked, "Nothing found".
- A check took 8 to 60 s on a slow home upload. Fill the wait with the lines
  marked *(while it checks)*, or cut the wait when editing.

## The script

| Time | On screen | Say |
|---|---|---|
| 0:00 | The page at rest: "34% NOT YOURS" over the drawn sample print, captioned "Sample: a drawn scene" | A Ring doorbell sees more than your home. It sees the street, and the house across the road. In 2021 a UK court ruled that a homeowner whose Ring cameras recorded his neighbour's home had broken data protection law. |
| 0:16 | Scroll slowly down to **Zones** on the sample, then back up | Ring lets you hide those parts with privacy zones, but you have to notice the problem and draw every zone yourself. This is a drawn example of what Good Neighbour does instead. |
| 0:31 | Paste the Ring token into **Ring access token** and press **Connect camera**; the line under the actions reads "Using your Ring token in this tab" | This is the hosted copy anyone can open. Paste a Ring access token from the Developer Playground, and it connects to your own camera. |
| 0:39 | Press **Start live stream**; the print fills with the porch clip | This is Ring's own sandbox camera, live through the Ring API. |
| 0:46 | Within 10 s, press **Check this view**; the headline reads "CHECKING" and the line under the picture says it is being sent | One frame goes to Qwen3-VL on Amazon Bedrock, which marks what is not yours: the road, neighbours' houses, cars on the street. At the same time the app reads this camera's existing privacy zones from the Ring API. |
| 0:59 | *(while it checks)* Keep the page in view | We tested seven vision models on Bedrock and picked this one. On 144 labelled photos it finds 96% of what is not yours, and 94% of houses. |
| 1:09 | The result: "Nothing outside your property was found in this view" | This porch is all the owner's, and it says so. It does not invent a problem. |
| 1:19 | Scroll to the top; press **Check a photo** and choose `ring-doorbell-frame.jpg` | Now a real Ring doorbell view of a street. A photo works too, and that matters: Ring's new encryption hides camera video from apps, so an owner can check a screenshot instead. |
| 1:34 | *(while it checks)* | The picture goes to Bedrock and nowhere else, and nothing is stored. |
| 1:44 | The headline: "5% NOT YOURS", and under the picture "5% of this view is not yours and is still recorded" | Five percent of this view is the neighbours' homes and the street. |
| 1:52 | Scroll to **Findings**, the dark band with the photo blurred behind it | In plain words: how much is not yours, how much is already hidden, and how much would still be recorded once the suggested zones are added. |
| 2:02 | Scroll to **Zones**; pause on the marked photo and the legend | Hatched is not yours. A dashed outline is a suggested zone: one over the houses, one over the road and its cars. |
| 2:16 | Press **Show what would be recorded**, then **Show the survey**; scroll to the zone prints cut from the photo | And this is what the camera would record with them in place. |
| 2:26 | Scroll to the zone list and **To apply a zone** | Ring allows two privacy zones per camera, so it never suggests more than you have left. You add them in the Ring app yourself: these are suggestions, not verdicts. |
| 2:38 | Switch the Mac to dark mode, then narrow the window to phone width | Light and dark, desktop and phone. |
| 2:44 | Back to the top of the page | Good Neighbour. Open source, on GitHub. Is your camera being a good neighbour? |

If you run short of time, drop the two *(while it checks)* lines and cut the waits.
Never present the drawn sample as a real result.

## If something goes wrong while recording

- **"The camera stream ended" before you press Check:** the sandbox clip ran
  out. Wait for **Start live stream** to work again (about 20 s) and retry.
- **The live check says it could not reach the picture checker:** the upload
  was too slow. Press **Check a photo** with the doorbell photo instead and
  carry on from 1:05; the live stream has already been shown.
- **The Ring token message appears:** the 30-minute token ran out. Get a new
  one in the Playground, paste it into **Ring access token** again, or carry
  on with **Check a photo**.
- **"You have used the checks allowed for now":** the hosted copy allows 10
  checks an hour per visitor. Wait, or record on your laptop instead
  (`npm run dev`, then http://127.0.0.1:3000; paste the token there the same
  way).

## Before recording

- [ ] Rehearse once with the doorbell photo, so you know the wait. Count
      your checks: rehearsal and recording together must stay under 10 an
      hour on the hosted copy.
- [ ] Right before recording: get a fresh token in the
      [Ring Developer Playground](https://developer.amazon.com/ring/console/playground)
      and copy it (it lasts 30 minutes).
- [ ] Open https://good-neighbour-delta.vercel.app in a new tab, so no token
      from an earlier test is remembered.
- [ ] Nothing else uploading on your connection (cloud sync, downloads).
- [ ] Reload the page so the recording starts on the drawn sample, with the
      token field empty.
- [ ] Browser at full screen, zoom 100%, bookmarks bar hidden, no other tabs.
- [ ] Mac in light mode for the start; Do Not Disturb on.
- [ ] `docs/test-photos/ring-doorbell-frame.jpg` easy to find in the file
      picker (copy it to the Desktop).
- [ ] Record with Cmd+Shift+5, "Record Entire Screen", microphone on in
      Options.

## After recording

- [ ] Trim the waits if needed (iMovie, or QuickTime's Edit, Trim for the
      start and end). Length under 3:00.
- [ ] Upload to YouTube as **Public**, in English. Title: "Good Neighbour: Is
      your Ring camera being a good neighbour?"
- [ ] In the YouTube description, credit the doorbell photo: "Ring Video
      Doorbell 2 capture" by Amin, CC BY-SA 4.0, via Wikimedia Commons (see
      `docs/test-photos/CREDITS.md`).
- [ ] Paste the link into the Devpost submission.
