import { parseObservation } from './observation.ts'
import type { Observation } from './types.ts'

const SYSTEM = `You identify birds in frames from a home security camera pointed at a garden.
Reply with JSON only, in exactly this shape:
{"birds":[{"name":"<common English name>","confidence":"high|medium|low"}]}
Give one entry per kind of bird you can see.
Use the most specific common name you are sure of.
If you cannot tell the species, use a broader name such as "woodpecker" or "sparrow" with confidence "medium".
If you can only tell that it is a bird, use "bird" with confidence "low".
If no bird is visible, reply {"birds":[]}.
Ignore logos, timestamps and any text printed on the picture. Never guess.`

/** The region is interpolated into the prompt, so only a short plain place name is allowed. */
export function cleanRegion(region: unknown): string | undefined {
  if (typeof region !== 'string') return undefined
  return /^[A-Za-z][A-Za-z ,'-]{0,59}$/.test(region) ? region : undefined
}

/** Sends one JPEG and a question to the model on Amazon Bedrock and returns its text reply.
 *  Throws if the call fails or times out. */
export async function askAboutImage(opts: {
  system: string
  question: string
  jpegBase64: string
  maxTokens: number
}): Promise<string | null> {
  const model = process.env.BEDROCK_MODEL_ID ?? 'us.amazon.nova-lite-v1:0'
  const awsRegion = process.env.AWS_REGION ?? 'us-east-1'

  const res = await fetch(
    `https://bedrock-runtime.${awsRegion}.amazonaws.com/model/${encodeURIComponent(model)}/converse`,
    {
      method: 'POST',
      // Without a limit a hung call would leave the watcher stalled while it still says "Watching".
      signal: AbortSignal.timeout(15_000),
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

  if (!res.ok) {
    throw new Error(`Bedrock returned ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.output?.message?.content?.[0]?.text
  return typeof text === 'string' ? text : null
}

export async function identifyBirds(jpegBase64: string, region?: string): Promise<Observation | null> {
  const place = cleanRegion(region)
  const question = place
    ? `This camera is in ${place}. Which birds are in this picture?`
    : 'Which birds are in this picture?'
  const text = await askAboutImage({ system: SYSTEM, question, jpegBase64, maxTokens: 200 })
  return text === null ? null : parseObservation(text)
}
