'use client'

import { useState, useRef, useCallback, RefObject } from 'react'
import { watchConnection } from '@/lib/ring/connection'
import { ringHeaders } from './useRingDevice'

interface UseWebRTCStreamOptions {
  videoRef: RefObject<HTMLVideoElement>
  deviceId?: string
  /** A Ring token pasted into the page, sent with each request to the stream route. */
  token?: string
}

interface UseWebRTCStreamReturn {
  streamActive: boolean
  streamError: string | null
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
}

/**
 * Manages WebRTC connection to Ring camera stream.
 * Handles ICE gathering, SDP negotiation, and cleanup.
 */
export function useWebRTCStream({ videoRef, deviceId, token }: UseWebRTCStreamOptions): UseWebRTCStreamReturn {
  const [streamActive, setStreamActive] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sessionUrlRef = useRef<string | null>(null)

  // Closes the connection and the Ring session and clears the picture.
  const teardown = useCallback(async () => {
    pcRef.current?.close()
    pcRef.current = null
    if (sessionUrlRef.current) {
      const sessionUrl = sessionUrlRef.current
      sessionUrlRef.current = null
      await fetch('/api/ring/stream', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...ringHeaders(token) },
        body: JSON.stringify({ sessionUrl }),
      }).catch(() => {})
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setStreamActive(false)
  }, [videoRef, token])

  const startStream = useCallback(async () => {
    if (pcRef.current) return // Already starting or running: a second press must not open a second session.
    setStreamError(null)
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      pcRef.current = pc

      watchConnection(pc, () => {
        if (pcRef.current === pc) void teardown().then(() => setStreamError('The camera stream ended.'))
      })

      pc.addTransceiver('audio', { direction: 'sendrecv' })
      pc.addTransceiver('video', { direction: 'recvonly' })

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0]
          setStreamActive(true)
        }
      }

      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        const timeout = setTimeout(() => resolve(), 3000)
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout)
            resolve()
          }
        }
      })

      const res = await fetch('/api/ring/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ringHeaders(token) },
        body: JSON.stringify({ sdpOffer: pc.localDescription!.sdp, deviceId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Stream start failed')
      }

      const { sdpAnswer, sessionUrl } = await res.json()
      sessionUrlRef.current = sessionUrl
      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stream failed'
      console.error('Stream error:', err)
      await teardown()
      setStreamError(message)
    }
  }, [videoRef, deviceId, token, teardown])

  const stopStream = useCallback(async () => {
    await teardown()
    setStreamError(null)
  }, [teardown])

  return { streamActive, streamError, startStream, stopStream }
}
