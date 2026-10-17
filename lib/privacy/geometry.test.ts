import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_ZONES, boxToZone, coverage, pointInZone, suggestZones } from './geometry.ts'
import type { Region, Zone } from './types.ts'

const near = (actual: number, expected: number, label = '') =>
  assert.ok(Math.abs(actual - expected) < 0.02, `${label} expected about ${expected}, got ${actual}`)

const leftHalf: Region = { kind: 'road', box: { x1: 0, y1: 0, x2: 0.5, y2: 1 } }
const square: Zone = [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }]
const triangle: Zone = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]

test('a point is inside a zone only when it lies within its outline', () => {
  assert.equal(pointInZone({ x: 0.5, y: 0.5 }, square), true)
  assert.equal(pointInZone({ x: 0.1, y: 0.5 }, square), false)
  assert.equal(pointInZone({ x: 0.2, y: 0.2 }, triangle), true)
  assert.equal(pointInZone({ x: 0.8, y: 0.8 }, triangle), false)
})

test('a zone with fewer than three corners contains nothing', () => {
  assert.equal(pointInZone({ x: 0.5, y: 0.5 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }]), false)
  assert.equal(pointInZone({ x: 0.5, y: 0.5 }, []), false)
})

test('a box becomes a four-corner zone, clockwise from the top-left', () => {
  assert.deepEqual(boxToZone({ x1: 0.1, y1: 0.2, x2: 0.6, y2: 0.9 }), [
    { x: 0.1, y: 0.2 }, { x: 0.6, y: 0.2 }, { x: 0.6, y: 0.9 }, { x: 0.1, y: 0.9 },
  ])
})

test('with nothing found, nothing is outside the property', () => {
  assert.deepEqual(coverage([], []), { outside: 0, hidden: 0, exposed: 0 })
})

test('a region with no privacy zone over it is fully exposed', () => {
  const c = coverage([leftHalf], [])
  near(c.outside, 0.5, 'outside')
  assert.equal(c.hidden, 0)
  near(c.exposed, 0.5, 'exposed')
})

test('a privacy zone over the region hides it', () => {
  const c = coverage([leftHalf], [boxToZone(leftHalf.box)])
  near(c.outside, 0.5, 'outside')
  near(c.hidden, 0.5, 'hidden')
  near(c.exposed, 0, 'exposed')
})

test('a zone over part of the region hides only that part', () => {
  const topLeft = boxToZone({ x1: 0, y1: 0, x2: 0.5, y2: 0.5 })
  const c = coverage([leftHalf], [topLeft])
  near(c.hidden, 0.25, 'hidden')
  near(c.exposed, 0.25, 'exposed')
})

test('overlapping regions are counted once', () => {
  const again: Region = { kind: 'vehicle', box: { x1: 0.25, y1: 0, x2: 0.5, y2: 1 } }
  near(coverage([leftHalf, again], []).outside, 0.5, 'outside')
})

test('a privacy zone over the owner’s own property does not count as hiding anything', () => {
  const rightHalf = boxToZone({ x1: 0.5, y1: 0, x2: 1, y2: 1 })
  const c = coverage([leftHalf], [rightHalf])
  assert.equal(c.hidden, 0)
  near(c.exposed, 0.5, 'exposed')
})

test('an uncovered region is suggested as a zone', () => {
  assert.deepEqual(suggestZones([leftHalf], []), [{ kinds: ['road'], zone: boxToZone(leftHalf.box) }])
})

test('a region that is already mostly hidden is not suggested again', () => {
  const most = boxToZone({ x1: 0, y1: 0, x2: 0.5, y2: 0.9 })
  assert.deepEqual(suggestZones([leftHalf], [most]), [])
})

test('a region that is only half hidden is still suggested', () => {
  const half = boxToZone({ x1: 0, y1: 0, x2: 0.5, y2: 0.5 })
  assert.equal(suggestZones([leftHalf], [half]).length, 1)
})

test('a speck too small to matter is not suggested', () => {
  const speck: Region = { kind: 'vehicle', box: { x1: 0.5, y1: 0.5, x2: 0.55, y2: 0.55 } }
  assert.deepEqual(suggestZones([speck], []), [])
})

test('a region inside a bigger one joins its zone instead of getting its own', () => {
  const road: Region = { kind: 'road', box: { x1: 0, y1: 0.5, x2: 1, y2: 0.7 } }
  const parkedCar: Region = { kind: 'vehicle', box: { x1: 0.2, y1: 0.52, x2: 0.4, y2: 0.66 } }
  assert.deepEqual(suggestZones([parkedCar, road], []), [{ kinds: ['road', 'vehicle'], zone: boxToZone(road.box) }])
})

// Ring's help: "You can make up to two Privacy Zones for each Ring device you have", drawn as boxes.
const house = (x1: number, x2: number): Region => ({ kind: 'neighbour', box: { x1, y1: 0.3, x2, y2: 0.45 } })
const corner = (x: number, y: number): Zone => boxToZone({ x1: x, y1: y, x2: x + 0.05, y2: y + 0.05 })

test('Ring allows two privacy zones per camera', () => {
  assert.equal(MAX_ZONES, 2)
})

test('never suggests more zones than Ring allows', () => {
  const spread: Region[] = [
    { kind: 'neighbour', box: { x1: 0, y1: 0, x2: 0.2, y2: 0.2 } },
    { kind: 'neighbour', box: { x1: 0.8, y1: 0, x2: 1, y2: 0.2 } },
    { kind: 'road', box: { x1: 0, y1: 0.8, x2: 0.2, y2: 1 } },
    { kind: 'vehicle', box: { x1: 0.8, y1: 0.8, x2: 1, y2: 1 } },
  ]
  assert.equal(suggestZones(spread, []).length, 2)
  assert.equal(suggestZones(spread, [corner(0.45, 0.45)]).length, 1)
})

test('a camera that already uses both zones gets no new suggestions', () => {
  assert.deepEqual(suggestZones([leftHalf], [corner(0.9, 0.9), corner(0.9, 0.0)]), [])
})

test('neighbouring houses share one zone when there are not enough zones for each', () => {
  const row = [house(0.1, 0.3), house(0.32, 0.5), house(0.52, 0.7)]
  const [only, ...rest] = suggestZones(row, [corner(0.9, 0.9)])
  assert.equal(rest.length, 0)
  assert.deepEqual(only, { kinds: ['neighbour'], zone: boxToZone({ x1: 0.1, y1: 0.3, x2: 0.7, y2: 0.45 }) })
})

test('distant houses too small on their own are covered together', () => {
  const specks = [house(0.4, 0.43), house(0.44, 0.47), house(0.48, 0.51)] // each under 1% of the frame
  assert.equal(suggestZones(specks, []).length, 1)
})

test('when one box would hide much of the owner’s view, the smaller area is left out', () => {
  const big: Region = { kind: 'neighbour', box: { x1: 0, y1: 0, x2: 0.3, y2: 0.3 } }
  const small: Region = { kind: 'vehicle', box: { x1: 0.85, y1: 0.85, x2: 1, y2: 1 } }
  assert.deepEqual(suggestZones([small, big], [corner(0.45, 0.45)]), [{ kinds: ['neighbour'], zone: boxToZone(big.box) }])
})

test('a shared zone names every kind it covers, the biggest first', () => {
  const road: Region = { kind: 'road', box: { x1: 0, y1: 0.5, x2: 0.6, y2: 0.6 } }
  const houses: Region = { kind: 'neighbour', box: { x1: 0, y1: 0.3, x2: 0.6, y2: 0.5 } }
  const [zone] = suggestZones([road, houses], [corner(0.9, 0.9)])
  assert.deepEqual(zone.kinds, ['neighbour', 'road'])
})

test('a distant house under 1% of the frame still gets a zone when one is free', () => {
  const far: Region = { kind: 'neighbour', box: { x1: 0.74, y1: 0.47, x2: 0.8, y2: 0.59 } } // 0.7%, from a real Ring frame
  assert.equal(suggestZones([far], []).length, 1)
})
