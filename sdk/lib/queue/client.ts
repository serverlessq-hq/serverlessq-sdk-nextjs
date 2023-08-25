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

    logVerbose(`[ServerlessQ] Created queue with id ${queue.id}`)

    return queue
  } catch (error) {
    return createError(error, 'could not create or update queue')
  }
}

/**
 * 
 * @param params.queueIdToOverride - the id of the queue to override @optional
 * @param params.route - the route of the message queue i.e. /api/newsletter
 * @param params.method - http method executed against the target
 * @param params.name - the name of the queue
 * @param params.body - the body of the request
 * @returns the response from the queue in the format { requestId: string, message: string }
 */

export const enqueue = async (
  params: EnqueueOptions & { queueIdToOverride?: string }
) => {
  validateOptionsOrThrow(params)

  const isProd = process.env.NODE_ENV === 'production'

  const PREFIX = isProd ? '' : 'DEV_'

  let queueId = params.queueIdToOverride
  let baseUrl = IS_VERCEL ? `https://${VERCEL_URL}` : BASE_URL

  const metadata = await useMetadata(isProd)
  const proxy = metadata['proxy']

  if (proxy) {
    baseUrl = `${proxy}`
  }

  if (!queueId) {
    queueId = metadata[`${PREFIX}${params.name}`]

    if (!queueId) {
      throw new Error(`No queue id found for ${params.name}`)
    }
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
