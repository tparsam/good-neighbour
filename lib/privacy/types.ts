/** A point in a camera picture. Both axes run 0 to 1 from the top-left corner, as in the Ring API. */
export interface Point {
  x: number
  y: number
}

/** A zone as the Ring API gives it: the corners of a polygon. */
export type Zone = Point[]

/** A rectangle in the picture, 0 to 1 on both axes. */
export interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** What the vision model can point at that is not the owner's own property. */
export type RegionKind = 'road' | 'neighbour' | 'vehicle'

export interface Region {
  kind: RegionKind
  box: Box
}
