'use client'

import { useEffect, useRef, useState } from 'react'
import { useWebRTCStream } from './hooks/useWebRTCStream'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [deviceId, setDeviceId] = useState<string>()
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ring/devices')
      .then(res => res.json())
      .then(data => {
        if (data.devices?.length) setDeviceId(data.devices[0].id)
        else setSetupError(data.error || 'No devices found')
      })
      .catch(err => setSetupError(err.message))
  }, [])

  const { streamActive, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })

  return (
    <main className="p-4">
      <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-3xl bg-black" />
      <p>
        <button onClick={streamActive ? stopStream : startStream} disabled={!deviceId}>
          {streamActive ? 'Stop' : 'Start live stream'}
        </button>
      </p>
      {(setupError || streamError) && <p role="alert">{setupError || streamError}</p>}
    </main>
  )
}
