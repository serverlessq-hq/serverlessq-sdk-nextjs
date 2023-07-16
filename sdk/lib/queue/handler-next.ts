import { HttpMethod} from '../types'
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
  handler: NextApiHandler,
  options: QueueOptions
}) {

  const { handler, options } = params

  async function nextApiHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<unknown> {
    return handler(req, res)
  }

  nextApiHandler.enqueue = async (enqueueOptions: EnqueueOptions) => {
    const { method, body } = enqueueOptions

    return await enqueue({
      name: options.name,
      method,
      route: options.route,
      body
    })
  }

  return nextApiHandler
}
