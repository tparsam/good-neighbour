'use client'

import { useEffect, useRef, useState } from 'react'
import { changed, thumbnail } from '@/lib/journal/frame-diff'
import { emptyState, flush, nextState } from '@/lib/journal/visits'
import type { EndedVisit, Observation } from '@/lib/journal/types'

const SAMPLE_MS = 2000
const FRAME_WIDTH = 768

export interface WatchStatus {
  watching: boolean
  reason: string | null
  current: string[]
}

interface Options {
  video: HTMLVideoElement | null
  enabled: boolean
  region?: string
  onVisitSaved: () => void
}

const OFFLINE: WatchStatus = { watching: false, reason: 'Camera offline', current: [] }

/** Samples the video, asks which birds are visible, and saves each finished visit. */
export function useBirdWatcher({ video, enabled, region, onVisitSaved }: Options): WatchStatus {
  const [status, setStatus] = useState<WatchStatus>(OFFLINE)
  const savedRef = useRef(onVisitSaved)
  savedRef.current = onVisitSaved
  const regionRef = useRef(region)
  regionRef.current = region

  useEffect(() => {
    if (!enabled || !video) {
      setStatus(OFFLINE)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const snapshots: Record<string, string> = {}
    let state = emptyState
    let lastThumb: number[] | null = null
    let lastObs: Observation | null = null
    let busy = false
    let saveError: string | null = null

    const save = async (ended: EndedVisit[]) => {
      for (const visit of ended) {
        const image = snapshots[visit.name]
        delete snapshots[visit.name]
        try {
          const res = await fetch('/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...visit, image }),
          })
          if (!res.ok) throw new Error((await res.json()).error)
          saveError = null
          savedRef.current()
        } catch (error) {
          saveError = `A visit by ${visit.name} could not be saved. ${error instanceof Error ? error.message : ''}`
        }
      }
    }

    const tick = async () => {
      if (busy || video.readyState < 2 || !video.videoWidth) return
      busy = true
      try {
        canvas.width = FRAME_WIDTH
        canvas.height = Math.round((FRAME_WIDTH * video.videoHeight) / video.videoWidth)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumb = thumbnail(ctx.getImageData(0, 0, canvas.width, canvas.height))

        let obs = lastObs
        let fresh = false
        let jpeg = ''
        if (!lastThumb || changed(lastThumb, thumb)) {
          jpeg = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: jpeg, region: regionRef.current }),
          })
          const data = await res.json()
          if (!res.ok) {
            setStatus({ watching: false, reason: data.error ?? 'Bird identification failed.', current: [] })
            return
          }
          lastThumb = thumb
          if (!data.observation) return // An unreadable reply is no observation, not "no birds".
          obs = data.observation as Observation
          lastObs = obs
          fresh = true
        }
        if (!obs) return

        const result = nextState(state, obs, Date.now(), fresh)
        state = result.state
        for (const name of result.started) snapshots[name] = jpeg
        await save(result.ended)
        setStatus({
          watching: true,
          reason: saveError,
          current: state.tracked.filter(t => t.open).map(t => t.name),
        })
      } catch {
        setStatus({ watching: false, reason: 'Bird identification failed.', current: [] })
      } finally {
        busy = false
      }
    }

    setStatus({ watching: true, reason: null, current: [] })
    const timer = setInterval(tick, SAMPLE_MS)
    return () => {
      clearInterval(timer)
      void save(flush(state)) // The stream ended: close and save any open visit.
    }
  }, [enabled, video])

  return status
}
