# Demo video script (target 2:30)

Status: draft. The timings and the "on screen" column are planned, not yet
measured. No live stream has been run. Replace both after the first real run,
using what `docs/findings.md` records about the stream's length.

| Time | On screen | Say |
|---|---|---|
| 0:00 | The page at rest: arched title over the empty oval, "Not watching: Camera offline" | Ring Bird Journal turns a Ring camera into a smart bird feeder camera. |
| 0:12 | Scroll once: Today and an empty Life list | It watches the live stream, names the birds that visit, and keeps a life list. |
| 0:25 | Back to the top. Press Start live stream; the oval fills with the Ring Playground's bird clip | This is Ring's own sandbox camera. Nothing is mocked. |
| 0:45 | The curved line changes to "Watching. At the feeder now: ..." | Every two seconds a frame goes to Amazon Nova Lite on Bedrock. A bird has to be named on two frames in a row before the app believes it. |
| 1:15 | The bird leaves; a new block appears in the Life list with its snapshot | One visit per bird, however long it stays, saved with a snapshot. |
| 1:40 | Today: the figures line | Today's numbers are counted from saved visits. No AI is used for the summary. |
| 1:55 | An "Unidentified bird" case, if one occurred | If the model is unsure, the app says so. It never invents a species. |
| 2:05 | Dark theme, then phone width | Light and dark, desktop and phone. |
| 2:15 | Terminal: `npm test` passing; the README | Open source, 44 tests, and a hard cap on AI cost. |

## Before recording

- A fresh Ring Playground token in `.env.local` (it lasts 30 minutes).
- An empty `data/` folder, so the Life list starts empty.
- System theme set to light for the first take.
