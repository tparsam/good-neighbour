import { parseRegions } from './regions.ts'
import type { Region } from './types.ts'

// The box format and the 0 to 1000 scale follow the prompt AWS documents for Nova object detection.
/** Chosen on 2026-10-17 by the scorecard (lib/privacy/eval.ts) and a live Ring frame: it found
 *  20 of 21 expected areas with no false alarms. Nova Lite found ~70% and called the owner's own
 *  porch a road. See docs/findings.md. */
export const MODEL = 'qwen.qwen3-vl-235b-a22b'

export const PROMPT = `You look at one frame from a home security camera and mark what is NOT part of the camera owner's own property.
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

/** Sends one JPEG and a question to the model on Amazon Bedrock and returns its text reply.
 *  Throws if the call fails or times out. */
export async function askAboutImage(opts: {
  system: string
  question: string
  jpegBase64: string
  maxTokens: number
  /** How long to wait for the answer, 15 s unless set. */
  timeoutMs?: number
  /** Which Bedrock model to ask. BEDROCK_MODEL_ID, when set, overrides it (for trying others). */
  model?: string
}): Promise<string | null> {
  const model = process.env.BEDROCK_MODEL_ID || opts.model || MODEL
  const awsRegion = process.env.AWS_REGION ?? 'us-east-1'

  const signal = AbortSignal.timeout(opts.timeoutMs ?? 15_000)
  const send = () => fetch(
    `https://bedrock-runtime.${awsRegion}.amazonaws.com/model/${encodeURIComponent(model)}/converse`,
    {
      method: 'POST',
      // Without a limit a hung call would leave the check waiting for ever.
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
      },
      body: JSON.stringify({
        system: [{ text: opts.system }],
        messages: [
          {
            role: 'user',
            content: [
              { image: { format: 'jpeg', source: { bytes: opts.jpegBase64 } } },
              { text: opts.question },
            ],
          },
        ],
        inferenceConfig: { maxTokens: opts.maxTokens, temperature: 0 },
      }),
    }
  )
  // On a slow connection the secure handshake alone can pass Node's 10 s connect limit; a second
  // try usually gets through. Only a connect timeout is retried, within the same overall limit.
  const res = await send().catch(error =>
    error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ? send() : Promise.reject(error)
  )

  if (!res.ok) {
    throw new Error(`Bedrock returned ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.output?.message?.content?.[0]?.text
  return typeof text === 'string' ? text : null
}

/** The areas of the picture that are not the owner's own, or null if the model gave no usable answer.
 *  First measured against Bedrock on 2026-10-17; see docs/findings.md. */
export async function findRegions(jpegBase64: string): Promise<Region[] | null> {
  const text = await askAboutImage({
    system: PROMPT,
    question: 'Mark the areas of this picture that are not the camera owner’s own property.',
    jpegBase64,
    maxTokens: 600,
    // A one-off check, so it can wait. Measured from a slow home connection on 2026-10-17: a
    // 1024 px picture took 7 to 58 seconds, almost all of it uploading; Bedrock itself took ~1 s.
    timeoutMs: 90_000,
    model: MODEL,
  })
  return text === null ? null : parseRegions(text)
}
