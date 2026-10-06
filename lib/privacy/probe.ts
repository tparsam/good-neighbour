// A throwaway probe, not part of the app. It answers one question: how good are Nova's
// boxes on doorbell-style pictures?
//
//   node --env-file=.env.local lib/privacy/probe.ts photo1.jpg [photo2.jpg ...]
//
// Needs AWS_BEARER_TOKEN_BEDROCK in .env.local. Each picture is one Bedrock call.
import { readFileSync } from 'node:fs'
import { findRegions } from './bedrock.ts'
import { coverage, suggestZones } from './geometry.ts'

const files = process.argv.slice(2)
if (files.length === 0 || !process.env.AWS_BEARER_TOKEN_BEDROCK) {
  console.error('Usage: node --env-file=.env.local lib/privacy/probe.ts photo.jpg [more.jpg]\nAWS_BEARER_TOKEN_BEDROCK must be set in .env.local.')
  process.exit(1)
}

const percent = (share: number) => `${Math.round(share * 100)}%`

for (const file of files) {
  console.log(`\n${file}`)
  try {
    const regions = await findRegions(readFileSync(file).toString('base64'))
    if (regions === null) {
      console.log('  no usable answer from the model')
      continue
    }
    for (const r of regions) {
      const b = r.box
      console.log(`  ${r.kind.padEnd(9)} x ${b.x1.toFixed(2)}-${b.x2.toFixed(2)}  y ${b.y1.toFixed(2)}-${b.y2.toFixed(2)}`)
    }
    const c = coverage(regions, [])
    console.log(`  not the owner's: ${percent(c.outside)} of the frame; suggested zones: ${suggestZones(regions, []).length}`)
  } catch (error) {
    console.log(`  failed: ${error instanceof Error ? error.message : error}`)
  }
}
