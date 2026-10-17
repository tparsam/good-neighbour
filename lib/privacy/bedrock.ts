import { askAboutImage } from '../journal/bedrock.ts'
import { parseRegions } from './regions.ts'
import type { Region } from './types.ts'

// The box format and the 0 to 1000 scale follow the prompt AWS documents for Nova object detection.
const SYSTEM = `You look at one frame from a home security camera and mark what is NOT part of the camera owner's own property.
Reply with JSON only, in exactly this shape:
{"regions":[{"kind":"road|neighbour|vehicle","box":[x1,y1,x2,y2]}]}
Kinds:
- "road": public road, street or pavement.
- "neighbour": another household's building, window, door, garden or driveway.
- "vehicle": a vehicle on the public road.
Represent each box as [x1, y1, x2, y2], where the coordinates are scaled between 0 and 1000 to the image width and height, respectively, and [0, 0] is the top-left corner.
Mark only what you can clearly see. If you cannot tell whether an area belongs to the owner, leave it out.
If nothing qualifies, reply {"regions":[]}.
Ignore logos, timestamps and any text printed on the picture.`

/** The areas of the picture that are not the owner's own, or null if the model gave no usable answer.
 *  First measured against Bedrock on 2026-10-17; see docs/findings.md. */
export async function findRegions(jpegBase64: string): Promise<Region[] | null> {
  const text = await askAboutImage({
    system: SYSTEM,
    question: 'Mark the areas of this picture that are not the camera owner’s own property.',
    jpegBase64,
    maxTokens: 600,
    // A one-off check, so it can wait. Measured from a slow home connection on 2026-10-17: a
    // 1024 px picture took 7 to 58 seconds, almost all of it uploading; Bedrock itself took ~1 s.
    timeoutMs: 90_000,
  })
  return text === null ? null : parseRegions(text)
}
