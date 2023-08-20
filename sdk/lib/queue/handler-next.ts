import { HttpMethod } from '../types'
import { extractMetaFromFilename } from '../utils/parser'
import { enqueue } from './client'
import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'

export interface QueueOptions {
  name: string
  route: string
  retries: number
}
export interface EnqueueOptions {
  method: HttpMethod
  body?: { [key: string]: any }
}

export function Queue(params: {
  handler: NextApiHandler
  options: Omit<QueueOptions, 'name'>
}) {
  const { handler, options } = params

  const meta = extractMetaFromFilename(options.route)

  async function nextApiHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<unknown> {
    return handler(req, res)
  }

  nextApiHandler.enqueue = async (enqueueOptions: EnqueueOptions) => {
    const { method, body } = enqueueOptions

    return await enqueue({
      name: meta.name,
      route: meta.route,
      method,
      body
    })
  }

  return nextApiHandler
}
