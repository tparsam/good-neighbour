/** Calls `onEnd` once when a WebRTC connection is really over. "failed" is final. "disconnected"
 *  often recovers by itself on a slow or patchy network, so it only counts if the connection is
 *  still not back after `graceMs`. Each state change is logged, to show why a stream ended. */
export function watchConnection(
  pc: { connectionState: string; onconnectionstatechange: null | ((event: any) => unknown) },
  onEnd: () => void,
  graceMs = 5000
) {
  let ended = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const end = () => {
    clearTimeout(timer)
    if (!ended) {
      ended = true
      onEnd()
    }
  }
  pc.onconnectionstatechange = () => {
    console.info('Ring stream connection:', pc.connectionState)
    clearTimeout(timer)
    if (pc.connectionState === 'failed') end()
    else if (pc.connectionState === 'disconnected') timer = setTimeout(() => pc.connectionState !== 'connected' && end(), graceMs)
  }
}
