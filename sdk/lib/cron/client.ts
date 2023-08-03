import { createError, http } from '../utils/axios'
import {
  BASE_URL,
  IS_VERCEL,
  OPTIONS_ERROR_MESSAGE,
  SLASH_ERROR_MESSAGE,
  VERCEL_URL,
  __VERBOSE__
} from '../utils/constants'
import { useMetadata } from '../utils/flag-file'
import { checkStringForSlashes } from '../utils/sanitize-input'
import { CronOptions } from './handler-next'

export type Cron = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  method: string
  target: string
  expression: string
}

export const upsertCron = async (options: CronOptions) => {
  validateOptionsOrThrow(options)
  const { method, retries = 3, expression, name } = options
  let baseUrl = IS_VERCEL ? `https://${VERCEL_URL}` : BASE_URL

  if (checkStringForSlashes(name)) {
    throw new Error(SLASH_ERROR_MESSAGE)
  }
  let target = options.target

  const metadata = await useMetadata()
  const proxy = metadata['proxy']

  if (proxy) {
    baseUrl = `${proxy}`
  }

  if (!baseUrl) {
    throw new Error('No baseUrl found')
  }

  let isValidUrl = true

  try {
    new URL(options.target)
    isValidUrl = false
  } catch {
    if (__VERBOSE__) {
      console.log(
        'Found relative path for cron target; adding base url',
        options.target
      )
    }
  }

  if (!isValidUrl) {
    throw new Error(
      'Please use only relative paths for cron targets; We will add the proxy for you. Please refer to the docs for more information.'
    )
  }

  const cronTarget = options.target.replace(/^\//g, '')
  target = `${baseUrl}/${cronTarget}`

  if (__VERBOSE__) {
    console.log('Setting cron target to ', target, 'from', options.target)
  }

  try {
    const resp = await http.post<Cron>(`/crons/${name}`, {
      method,
      target,
      retries,
      cronExpression: expression
    })

    if (__VERBOSE__) {
      console.log(`Cron created with id ${resp.data.id}`)
    }
    return resp.data
  } catch (error) {
    return createError(error, 'could not create or update cron')
  }
}

const validateOptionsOrThrow = (options: CronOptions) => {
  if (!options.target || !options.method || !options.expression) {
    throw new Error(OPTIONS_ERROR_MESSAGE)
  }
}
