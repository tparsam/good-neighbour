/** Turns a failed picture check into a status and a message the owner can act on. */
export function describeFailure(error: unknown): { status: number; error: string } {
  const e = error as { name?: string; message?: string; cause?: { code?: string } }
  if (e?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
    return {
      status: 504,
      error: 'Could not reach the picture checker in time. Your internet connection may be slow or busy; try again.',
    }
  }
  if (e?.name === 'TimeoutError') {
    return { status: 504, error: 'The check took too long, probably because the upload was slow. Try again.' }
  }
  const status = /^Bedrock returned (\d{3})/.exec(e?.message ?? '')?.[1]
  if (status === '401' || status === '403') {
    return {
      status: 502,
      error: 'The picture checker refused the request. Check AWS_BEARER_TOKEN_BEDROCK in .env.local and that the AWS account is active.',
    }
  }
  if (status === '429') {
    return { status: 502, error: 'The picture checker is busy. Wait a minute, then try again.' }
  }
  return { status: 502, error: 'The picture check failed. Try again.' }
}
