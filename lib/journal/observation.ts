import { z } from 'zod'
import type { Observation } from './types.ts'

const schema = z.object({
  birds: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        confidence: z.enum(['high', 'medium', 'low']),
      })
    )
    .max(10),
})

/** Reads the model's reply. Anything that is not the agreed JSON is "no observation". */
export function parseObservation(text: string): Observation | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const result = schema.safeParse(JSON.parse(text.slice(start, end + 1)))
    return result.success ? result.data : null
  } catch {
    return null
  }
}
