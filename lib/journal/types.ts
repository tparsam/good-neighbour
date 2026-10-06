export type Confidence = 'high' | 'medium' | 'low'

export interface Bird {
  name: string
  confidence: Confidence
}

export interface Observation {
  birds: Bird[]
}

export interface EndedVisit {
  name: string
  start: number
  end: number
  confidence: Confidence
}

export interface Visit extends EndedVisit {
  id: string
  snapshot?: string
}
