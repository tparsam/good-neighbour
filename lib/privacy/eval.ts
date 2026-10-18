// Scores the model on the labelled photos in docs/test-photos (labels.json). Each photo is one
// Bedrock call, so a full run uploads about 18 MB.
//
//   node --env-file=.env.local lib/privacy/eval.ts [prompt.txt] [runs] [answers.json]
//
// With no prompt file it scores the app's own prompt on the app's model; set BEDROCK_MODEL_ID to
// score another model. Every answer is saved to answers.json (if given) so the scoring can be
// re-run without calling Bedrock again: node lib/privacy/eval.ts --rescore answers.json
import { readFileSync, writeFileSync } from 'node:fs'
import { MODEL, PROMPT, askAboutImage } from './bedrock.ts'
import { parseRegions } from './regions.ts'
import { matches, wilson } from './score.ts'
import type { Region, RegionKind } from './types.ts'

const dir = new URL('../../docs/test-photos/', import.meta.url)
type Label = { file: string; areas: { kind: RegionKind; box: [number, number, number, number] }[] }
const toRegion = (a: Label['areas'][number]): Region => ({ kind: a.kind, box: { x1: a.box[0], y1: a.box[1], x2: a.box[2], y2: a.box[3] } })
const labels: Label[] = JSON.parse(readFileSync(new URL('labels.json', dir), 'utf8'))

type Answer = { file: string; run: number; regions: Region[] | null; error?: string }
let answers: Answer[]

if (process.argv[2] === '--rescore') {
  answers = JSON.parse(readFileSync(process.argv[3], 'utf8'))
} else {
  const prompt = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : PROMPT
  const runs = Number(process.argv[3] || 1)
  const out = process.argv[4]
  answers = []
  for (let run = 1; run <= runs; run++) {
    for (const [i, label] of labels.entries()) {
      const jpegBase64 = readFileSync(new URL(label.file, dir)).toString('base64')
      let answer: Answer = { file: label.file, run, regions: null }
      try {
        const text = await askAboutImage({ system: prompt, question: 'Mark the areas of this picture that are not the camera owner’s own property.', jpegBase64, maxTokens: 800, timeoutMs: 120_000, model: MODEL })
        answer.regions = text === null ? null : parseRegions(text)
      } catch (error) {
        answer.error = error instanceof Error ? error.message.slice(0, 200) : String(error)
      }
      answers.push(answer)
      console.error(`run ${run} ${i + 1}/${labels.length} ${label.file}: ${answer.error ? 'failed' : answer.regions === null ? 'no answer' : answer.regions.length + ' marks'}`)
      if (out) writeFileSync(out, JSON.stringify(answers, null, 1))
    }
  }
}

// Score.
const byFile = new Map(labels.map(l => [l.file, l.areas.map(toRegion)]))
const pct = (k: number, n: number) => {
  const [lo, hi] = wilson(k, n)
  return `${k} of ${n} = ${n ? Math.round((100 * k) / n) : 0}% (95% range ${Math.round(lo * 100)} to ${Math.round(hi * 100)}%)`
}
let found = 0, expected = 0, posPhotos = 0, allFound = 0, negPhotos = 0, negWithMarks = 0, marks = 0, strayMarks = 0, failed = 0
const kinds: Record<string, [number, number]> = {}
for (const a of answers) {
  const want = byFile.get(a.file)!
  if (a.regions === null) {
    failed++
    continue
  }
  if (want.length === 0) {
    negPhotos++
    if (a.regions.length > 0) negWithMarks++
    continue
  }
  posPhotos++
  const hits = want.map(w => a.regions!.some(g => matches(g, w)))
  hits.forEach((hit, i) => {
    const k = (kinds[want[i].kind] ??= [0, 0])
    k[0] += hit ? 1 : 0
    k[1]++
  })
  found += hits.filter(Boolean).length
  expected += want.length
  if (hits.every(Boolean)) allFound++
  marks += a.regions.length
  // A mark that matches no labelled area of any kind: a false alarm, or something the labels missed.
  strayMarks += a.regions.filter(g => !want.some(w => matches({ kind: w.kind, box: g.box }, w))).length
}

console.log(`\nModel: ${process.env.BEDROCK_MODEL_ID || MODEL}`)
console.log(`Answers scored: ${answers.length - failed} of ${answers.length} (${failed} failed or unusable)\n`)
console.log(`Areas found:                 ${pct(found, expected)}`)
for (const [kind, [k, n]] of Object.entries(kinds)) console.log(`  ${kind.padEnd(10)}                 ${pct(k, n)}`)
console.log(`Photos with every area found: ${pct(allFound, posPhotos)}`)
console.log(`Empty scenes marked anyway:  ${pct(negWithMarks, negPhotos)}`)
console.log(`Marks matching no labelled area: ${strayMarks} of ${marks}`)
