import { checkStringForSlashes } from '../utils/sanitize-input'
import { BASE_URL, IS_VERCEL, OPTIONS_ERROR_MESSAGE, VERCEL_URL, __VERBOSE__ } from '../utils/constants'
import { AxiosRequestConfig } from 'axios'
import { http, createError } from '../utils/axios'
import { HttpMethod } from '../types'
import { setMetadata, useMetadata } from '../utils/flag-file'

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
  nameOfQueue: string,
  options: { retries: number }
) => {
  if (checkStringForSlashes(nameOfQueue)) {
    throw new Error('Queue name cannot contain slashes')
  }

  try {
    const queue = (
      await http.post<Queue>(`/queues/${nameOfQueue}`, options)
    ).data

    await setMetadata({ [nameOfQueue]: queue.id })

    if(__VERBOSE__) {
      console.log(`Queue created with id ${queue.id}`)
    }
    return queue
  } catch (error) {
    return createError(error, 'could not create or update queue')
  }
}

export const enqueue = async (params: EnqueueOptions & { queueIdToOverride?: string }) => {
  validateOptionsOrThrow(params)

  const PREFIX = process.env.NODE_ENV === 'production' ? '' : 'DEV_';

  
  let queueId = params.queueIdToOverride;
  let baseUrl = IS_VERCEL ? `https://${VERCEL_URL}` : BASE_URL;

  const metadata = await useMetadata()
  const proxy = metadata['proxy']

  if(proxy) {
    baseUrl = `${proxy}`
  }

  if(!queueId) {  
    queueId = metadata[`${PREFIX}${params.name}`]
  
    if (!queueId) {
      throw new Error(`No queue id found for ${params.name}`)
    }
  }

  if(!baseUrl) {
    throw new Error('No baseUrl found')
  }

  const config: AxiosRequestConfig = {
    method: params.method,
    params: {
      id: queueId,
      target: `${baseUrl}/${params.route.replace(/^\//g, '')}`
    },
    ...(params.body && { json: params.body }),
  }

  try {
    return (await http.request<QueueResponse>(config)).data
  } catch (error) {
    return createError(error, 'could not enqueue')
  }
}

  const validateOptionsOrThrow = (options: EnqueueOptions) => {
    if (!options.route || !options.method) {
      throw new Error(OPTIONS_ERROR_MESSAGE)
    }
}
