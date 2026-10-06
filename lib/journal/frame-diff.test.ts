import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changed, COLS, ROWS, thumbnail } from './frame-diff.ts'

const W = 64, H = 36

function frame(paint: (x: number, y: number) => number) {
  const data = new Uint8ClampedArray(W * H * 4)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      data[i] = data[i + 1] = data[i + 2] = paint(x, y)
      data[i + 3] = 255
    }
  }
  return { data, width: W, height: H }
}

test('a thumbnail has one brightness value per cell', () => {
  const t = thumbnail(frame(() => 100))
  assert.equal(t.length, COLS * ROWS)
  assert.ok(t.every(v => v === 100))
})

test('the same picture has not changed', () => {
  assert.equal(changed(thumbnail(frame(() => 100)), thumbnail(frame(() => 100))), false)
})

test('a small overall brightness shift is not a change', () => {
  assert.equal(changed(thumbnail(frame(() => 100)), thumbnail(frame(() => 104))), false)
})

test('one small bright object appearing is a change', () => {
  const withBird = frame((x, y) => (x >= 10 && x < 14 && y >= 10 && y < 14 ? 220 : 100))
  assert.equal(changed(thumbnail(frame(() => 100)), thumbnail(withBird)), true)
})

test('thumbnails of different sizes count as changed', () => {
  assert.equal(changed([1, 2, 3], [1, 2]), true)
})
