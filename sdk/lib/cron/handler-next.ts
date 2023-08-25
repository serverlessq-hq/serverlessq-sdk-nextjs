import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { HttpMethod } from '../types'

export interface CronOptions {
  name: string
  target: string
  method: HttpMethod
  expression: string
  retries?: number
}
/**
 * Creates a new cron jobs and returns the next api handler
 * @param params.handler - the function to be called when the cron is triggered
 * @param params.options.target - the target of the cron. Optional and defaults to the route of the cron
 * @param params.options.method - the http method to be executed against the target
 * @param params.options.expression - the cron expression
 * @param params.options.retries - the number of retries to be attempted @default 1
 * @returns The next api handler to be called on cron invocations
 */
export function Cron(params: {
  handler: NextApiHandler
  options: Omit<CronOptions, 'name' | 'target'>
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
