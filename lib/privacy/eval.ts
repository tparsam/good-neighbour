// Scores the prompt on the photos in docs/test-photos. Each call goes to Bedrock.
//
//   node --env-file=.env.local lib/privacy/eval.ts [prompt.txt] [runs]
//
// With no prompt file it scores the app's own prompt. For each photo it reports which
// expected areas were found (a found box of the right kind that covers 30% of the expected
// box, or whose centre lies inside it) and, for the churchyard, any false "neighbour".
import { readFileSync } from 'node:fs'
import { askAboutImage } from '../journal/bedrock.ts'
import { PROMPT } from './bedrock.ts'
import { parseRegions } from './regions.ts'
import type { Box, RegionKind } from './types.ts'

const b = (x1: number, y1: number, x2: number, y2: number): Box => ({ x1, y1, x2, y2 })
// Drawn by hand from each photo, 0 to 1 from the top-left.
const PHOTOS: { file: string; want: { name: string; kind: RegionKind; box: Box }[] }[] = [
  { file: 'ring-doorbell-frame.jpg', want: [
    { name: 'houses left', kind: 'neighbour', box: b(0.17, 0.4, 0.45, 0.57) },
    { name: 'house right', kind: 'neighbour', box: b(0.74, 0.47, 0.8, 0.59) },
    { name: 'cars left', kind: 'vehicle', box: b(0.09, 0.57, 0.2, 0.65) },
    { name: 'car right', kind: 'vehicle', box: b(0.81, 0.57, 0.87, 0.62) } ] },
  { file: 'front-door-street-view.jpg', want: [
    { name: 'road', kind: 'road', box: b(0.27, 0.51, 1, 0.56) },
    { name: 'house centre', kind: 'neighbour', box: b(0.49, 0.38, 0.69, 0.49) },
    { name: 'house left', kind: 'neighbour', box: b(0.29, 0.43, 0.37, 0.5) },
    { name: 'house right', kind: 'neighbour', box: b(0.82, 0.4, 0.93, 0.48) },
    { name: 'cars', kind: 'vehicle', box: b(0.39, 0.47, 0.6, 0.53) } ] },
  { file: 'street-from-across-the-road.jpg', want: [
    { name: 'road', kind: 'road', box: b(0, 0.84, 1, 1) },
    { name: 'house opposite', kind: 'neighbour', box: b(0.08, 0.3, 0.83, 0.82) },
    { name: 'house right', kind: 'neighbour', box: b(0.82, 0.38, 1, 0.8) } ] },
  // Not a home: nothing here should be called a neighbour.
  { file: 'churchyard-porch-control.jpg', want: [] },
]

const covered = (g: Box, w: Box) => {
  const x = Math.min(g.x2, w.x2) - Math.max(g.x1, w.x1)
  const y = Math.min(g.y2, w.y2) - Math.max(g.y1, w.y1)
  return x > 0 && y > 0 ? (x * y) / ((w.x2 - w.x1) * (w.y2 - w.y1)) : 0
}
const centreIn = (g: Box, w: Box) => {
  const x = (g.x1 + g.x2) / 2
  const y = (g.y1 + g.y2) / 2
  return x >= w.x1 && x <= w.x2 && y >= w.y1 && y <= w.y2
}

const prompt = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : PROMPT
const runs = Number(process.argv[3] ?? 2)
let found = 0
let expected = 0
let falseAlarms = 0
let noAnswer = 0
for (const photo of PHOTOS) {
  const jpegBase64 = readFileSync(new URL(`../../docs/test-photos/${photo.file}`, import.meta.url)).toString('base64')
  for (let run = 0; run < runs; run++) {
    let text: string | null = null
    try {
      text = await askAboutImage({ system: prompt, question: 'Mark the areas of this picture that are not the camera owner’s own property.', jpegBase64, maxTokens: 600, timeoutMs: 120_000 })
    } catch (error) {
      console.log(`${photo.file} run ${run + 1}: failed, ${error instanceof Error ? error.message : error}`)
    }
    const regions = text === null ? null : parseRegions(text)
    if (regions === null) {
      noAnswer++
      console.log(`${photo.file} run ${run + 1}: no usable answer`)
      continue
    }
    const hits = photo.want.map(w => regions.some(g => g.kind === w.kind && (covered(g.box, w.box) >= 0.3 || centreIn(g.box, w.box))))
    const wrong = photo.want.length === 0 ? regions.filter(g => g.kind === 'neighbour').length : 0
    found += hits.filter(Boolean).length
    expected += photo.want.length
    falseAlarms += wrong
    const line = photo.want.length ? photo.want.map((w, i) => `${hits[i] ? 'found' : 'MISSED'} ${w.name}`).join(', ') : `false neighbours: ${wrong}`
    console.log(`${photo.file} run ${run + 1}: ${line}`)
  }
}
console.log(`\nScore: found ${found} of ${expected}, false alarms ${falseAlarms}, no answer ${noAnswer}`)
