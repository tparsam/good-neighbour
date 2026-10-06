import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lifeList, todaySummary } from './summary.ts'
import type { Confidence, Visit } from './types.ts'

const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime()
let n = 0
const visit = (name: string, start: number, confidence: Confidence = 'high', snapshot?: string): Visit => ({
  id: `${start}-${n++}`, name, start, end: start + 5000, confidence, snapshot,
})

test('an empty journal has an empty life list', () => {
  assert.deepEqual(lifeList([]), [])
})

test('visits by the same bird become one life-list entry', () => {
  const list = lifeList([visit('Blue Jay', at(5, 7)), visit('blue  jay', at(6, 9)), visit('Junco', at(6, 8))])
  assert.deepEqual(list.map(s => [s.name, s.visits]), [['Junco', 1], ['Blue Jay', 2]])
  assert.equal(list[1].firstSeen, at(5, 7))
  assert.equal(list[1].lastSeen, at(6, 9))
})

test('unidentified birds are not on the life list', () => {
  assert.deepEqual(lifeList([visit('Unidentified bird', at(6, 7), 'low')]), [])
})

test('the card shows the most confident snapshot, then the newest', () => {
  const list = lifeList([
    visit('Blue Jay', at(5, 7), 'medium', 'a.jpg'),
    visit('Blue Jay', at(5, 8), 'high', 'b.jpg'),
    visit('Blue Jay', at(5, 9), 'high', 'c.jpg'),
    visit('Blue Jay', at(5, 10), 'high'),
  ])
  assert.equal(list[0].snapshot, 'c.jpg')
})

test('today counts only visits that started today', () => {
  const visits = [
    visit('Blue Jay', at(5, 23, 59)),
    visit('Blue Jay', at(6, 7, 10)),
    visit('Junco', at(6, 7, 40)),
    visit('Unidentified bird', at(6, 15), 'low'),
  ]
  assert.deepEqual(todaySummary(visits, at(6, 18)), { species: 2, visits: 3, busiestHour: 7 })
})

test('a day with no visits has no busiest hour', () => {
  assert.deepEqual(todaySummary([visit('Blue Jay', at(5, 7))], at(6, 18)), { species: 0, visits: 0, busiestHour: null })
})

test('when two hours tie, the earlier one is the busiest', () => {
  const visits = [visit('Blue Jay', at(6, 9)), visit('Blue Jay', at(6, 7))]
  assert.equal(todaySummary(visits, at(6, 18)).busiestHour, 7)
})
