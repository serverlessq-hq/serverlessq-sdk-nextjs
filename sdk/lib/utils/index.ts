import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants'
import { createHmac } from 'crypto'
import { NextApiRequest } from 'next'
import { IS_VERCEL, LOCAL_DEVELOPMENT_ERROR, VERCEL_URL } from './constants'
import { extractApiRoute } from './sanitize-input'

export const isProduction = (phase: any) =>
  [PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER].includes(phase)

export const buildCronTarget = (localTarget?: string) => {
  if (!IS_VERCEL) {
    if (!localTarget) {
      throw new Error(LOCAL_DEVELOPMENT_ERROR)
    }
    return localTarget
  }
  return `https://${VERCEL_URL}/${extractApiRoute(__filename)}`
}

/**
 * Verifies if the request was sent from ServerlessQ
 * @param req - the next api request for the incoming request
 * @param payload - the target of the request i.e. <your-server-url>/api/queue
 * @returns
 */
export const verifySignature = (req: NextApiRequest, payload: string) => {
  const signature = createHmac(
    'sha256',
    String(process.env.SERVERLESSQ_API_TOKEN)
  )
    .update(payload)
    .digest('hex')
  return signature === req.headers['x-serverlessq-signature']
}

export const fetchCalleStackTrace = () => {
  const error = new Error()
  return error?.stack
    ?.split('\n')
    .slice(2)
    .map(line => line.replace(/\s+at\s+/, ''))[1] // first line is this function, second line is the caller
}

export const isValidUrl = (url: string) => {
  // Regular expression to match a valid URL
  const urlPattern = /^(http|https):\/\/[^ "]+$/
  return urlPattern.test(url)
}
