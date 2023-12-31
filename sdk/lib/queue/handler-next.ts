import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { HttpMethod } from '../types'
import { enqueueByQueue } from './client'

export interface QueueOptions {
  name: string
  route: string
  retries?: number
}
export interface EnqueueOptions {
  method: HttpMethod
  body?: { [key: string]: any }
}

/**
 * Creates a new queue and returns the next api handler
 * @param params.handler - the function to be called when the queue is triggered
 * @param params.options.name - the name of the queue. Needs to be unique @example NewsletterQueue
 * @param params.options.route - the route of the key in the format /api/queue @example /api/newsletter
 * @param params.options.retries - the number of retries to be attempted @default 1
 * @returns the next api handler wrapped in the queue an enhanced with an enqueue function
 */
export function Queue(params: {
  handler: NextApiHandler
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

    return await enqueueByQueue({
      name: options.name,
      route: options.route,
      method,
      body
    })
  }

  return nextApiHandler
}
