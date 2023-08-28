import { AxiosRequestConfig } from 'axios'
import { HttpMethod } from '../types'
import {
  checkIfResourcesConflictError,
  createError,
  http
} from '../utils/axios'
import {
  BASE_URL,
  IS_VERCEL,
  OPTIONS_ERROR_MESSAGE,
  VERCEL_URL
} from '../utils/constants'
import { setMetadata, useMetadata } from '../utils/flag-file'
import { logVerbose } from '../utils/logging'
import { QueueOptions } from './handler-next'
import { isValidUrl } from '../utils'

type QueueResponse = {
  requestId: string
  message: string
}

export type Queue = {
  queueType: string
  userId: string
  updatedAt: string
  status: string
  createdAt: string
  sqsUrl: string
  'variant#createdAt': string
  id: string
  arn: string
  name: string
  metaData: { retries: number }
}

/**
 * @param route - the route of the message queue i.e. /api/newsletter
 * @param method - http method executed against the target
 * @param queueId - the id of the message queue
 */
export type EnqueueOptionsWithQueueId = {
  route: string
  method: HttpMethod
  queueId: string
  name: string
  body?: { [key: string]: any }
}

type EnqueueOptions = Omit<EnqueueOptionsWithQueueId, 'queueId'>

export const upsertQueue = async (
  options: QueueOptions,
  isProduction: boolean
) => {
  try {
    const queue = (
      await http.post<Queue>(`/queues/${options.name}`, {
        ...options,
        retries: options.retries || 1
      })
    ).data

    await setMetadata({ [options.name]: queue.id }, isProduction)

    console.info(`[ServerlessQ] Created queue with id`, queue.id, "and name", options.name)

    return queue
  } catch (error) {
    return createError(error, 'could not create or update queue')
  }
}

/**
 * This function enqueues a message to a queue with a given name
 * @param params.route - the route of the message queue i.e. /api/newsletter
 * @param params.method - http method executed against the target
 * @param params.name - the name of the queue
 * @param params.body - the body of the request
 * @returns the response from the queue in the format { requestId: string, message: string }
 */
export const enqueueByQueue = async (params: EnqueueOptions) => {
  validateOptionsOrThrow(params)

  const isProd = process.env.NODE_ENV === 'production'

  const PREFIX = isProd ? '' : 'DEV_'

  let baseUrl = IS_VERCEL ? `https://${VERCEL_URL}` : BASE_URL

  const metadata = await useMetadata(isProd)
  const proxy = metadata['proxy']

  if (proxy) {
    baseUrl = `${proxy}`
  }

  const queueId = metadata[`${PREFIX}${params.name}`]

  if (!queueId) {
    throw new Error(`No queue id found for ${params.name}`)
  }

  if (!baseUrl) {
    throw new Error('No baseUrl found')
  }

  const config: AxiosRequestConfig = {
    method: params.method,
    params: {
      id: queueId,
      target: `${baseUrl}/${params.route.replace(/^\//g, '')}`
    },
    ...(params.body && { data: params.body })
  }

  try {
    return (await http.request<QueueResponse>(config)).data
  } catch (error) {
    return createError(error, 'could not enqueue')
  }
}

/**
 * This function sends a message to an existing queue with a given ID
 * @param params.queueId - the id of the queue to override @example 1234
 * @param params.method - http method executed against the target @example POST
 * @param params.target - full URL of the target @example https://example.com/api/queue
 * @param params.body - the body of the request @optional @example { name: 'John Doe' }
 * @returns the response from the queue in the format { requestId: string, message: string } @example { requestId: '1234', message: 'Message enqueued' }
 */

export const enqueueExistingQueues = async (params: {
  queueId: string
  method: HttpMethod
  target: string
  body?: any
}) => {
  if (!params.target || !params.method || !params.queueId) {
    throw new Error(
      'Missing required parameters. Please provide queueId, method and target.'
    )
  }

  if (!isValidUrl(params.target)) {
    throw new Error('Please provide a valid URL for the target.')
  }

  const config: AxiosRequestConfig = {
    method: params.method,
    params: {
      id: params.queueId,
      target: params.target
    },
    ...(params.body && { data: params.body })
  }

  try {
    return (await http.request<QueueResponse>(config)).data
  } catch (error) {
    return createError(error, 'Error - Could not enqueue message')
  }
}

export const deleteQueue = async (nameOfQueue: string) => {
  try {
    const resp = await http.request<void>({
      method: 'DELETE',
      url: `/queues/${nameOfQueue}`
    })
    logVerbose(`[ServerlessQ] Queue ${nameOfQueue} deleted`)

    return resp.data
  } catch (error) {
    if (checkIfResourcesConflictError(error)) {
      console.log(
        `Queue ${nameOfQueue} not deleted as it is currently in creation`
      )
      return createError(error, 'Queue is currently in creation')
    }
    return createError(error, 'could not delete queue')
  }
}

const validateOptionsOrThrow = (options: EnqueueOptions) => {
  if (!options.route || !options.method) {
    throw new Error(OPTIONS_ERROR_MESSAGE)
  }
}
