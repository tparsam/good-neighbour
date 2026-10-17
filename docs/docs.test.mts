// Keeps README.md and the demo script true to the code: every file, npm script and
// setting they name must exist, and the numbers the README states must match the code.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { HIDDEN_ENOUGH, MAX_ZONES, TOO_SMALL, coverage } from '../lib/privacy/geometry.ts'
import { SAMPLE_REGIONS, SAMPLE_ZONES } from '../app/privacy/sample.ts'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const docs = { 'README.md': read('README.md'), 'docs/demo-script.md': read('docs/demo-script.md') }
// Line breaks inside a sentence become single spaces, so phrases can be matched across wrapping.
const readme = docs['README.md'].replace(/\s+/g, ' ')

for (const [name, text] of Object.entries(docs)) {
  test(`${name} names only files that exist`, () => {
    const paths = [...text.matchAll(/`([^`\s]+)`/g)]
      .map(m => m[1])
      .filter(s => /^[\w.-]+(\/[\w.-]*)*$/.test(s) && (s.includes('/') || /\.(md|ts|tsx|json)$/.test(s)))
    assert.ok(paths.length > 0)
    for (const path of paths) assert.ok(existsSync(new URL(path, root)), `${name} names ${path}, which does not exist`)
  })

  test(`${name} names only npm scripts that exist`, () => {
    const scripts = JSON.parse(read('package.json')).scripts
    for (const [, script] of text.matchAll(/npm run (\w+)/g)) assert.ok(script in scripts, `npm run ${script} is not a script`)
  })
}

test('README names only settings that .env.example has', () => {
  const example = read('.env.example')
  const settings = new Set([...docs['README.md'].matchAll(/`([A-Z][A-Z0-9]*_[A-Z0-9_]+)(=|`)/g)].map(m => m[1]))
  assert.ok(settings.size >= 4)
  for (const setting of settings) assert.match(example, new RegExp(`^#? ?${setting}=`, 'm'), `${setting} is not in .env.example`)
})

test('README states the suggestion thresholds the code uses', () => {
  const pct = (share: number) => `${+(share * 100).toFixed(2)}%`
  assert.ok(readme.includes(`at least ${pct(HIDDEN_ENOUGH)} of it is already hidden`))
  assert.ok(readme.includes(`smaller than ${pct(TOO_SMALL)} of the frame is not suggested`))
  assert.ok(readme.includes(`up to ${MAX_ZONES} privacy zones`))
})

test('README quotes the figure the sample result really shows', () => {
  const exposed = Math.round(coverage(SAMPLE_REGIONS, SAMPLE_ZONES).exposed * 100)
  assert.ok(readme.includes(`"${exposed}% of this view is not yours and is still recorded"`))
})
