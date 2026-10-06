import type { Region, Zone } from '@/lib/privacy/types'

// A made-up result for the drawn sample scene in SampleScene.tsx. It stands in for what the
// vision model would return, so the screen can be seen before a Bedrock key exists.
// The numbers shown on the page are computed from these by the real geometry code.

/** Areas of the sample scene that are not the owner's own. */
export const SAMPLE_REGIONS: Region[] = [
  { kind: 'road', box: { x1: 0, y1: 0.478, x2: 1, y2: 0.667 } },
  { kind: 'neighbour', box: { x1: 0.575, y1: 0.067, x2: 0.956, y2: 0.478 } },
  { kind: 'vehicle', box: { x1: 0.15, y1: 0.485, x2: 0.36, y2: 0.63 } },
]

/** A privacy zone the sample camera already has: one of the neighbour's windows. */
export const SAMPLE_ZONES: Zone[] = [
  [
    { x: 0.82, y: 0.22 },
    { x: 0.92, y: 0.22 },
    { x: 0.92, y: 0.36 },
    { x: 0.82, y: 0.36 },
  ],
]
