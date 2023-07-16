import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { HttpMethod } from '../types'

export interface CronOptions {
  name: string
  target: string
  method: HttpMethod
  expression: string
  retries?: number
}

export function Cron(params: {
  handler: NextApiHandler,
  options: CronOptions
}) {

  const { handler } = params
  
  async function nextApiHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<unknown> {
    return handler(req, res)
  }
  
  return nextApiHandler
}