import { isValidUrl } from '../utils'
import {
  checkIfResourcesConflictError,
  createError,
  http
} from '../utils/axios'
import {
  BASE_URL,
  IS_VERCEL,
  OPTIONS_ERROR_MESSAGE,
  SLASH_ERROR_MESSAGE,
  VERCEL_URL
} from '../utils/constants'
import { useMetadata } from '../utils/flag-file'
import { logVerbose } from '../utils/logging'
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

export const upsertCron = async (
  options: CronOptions,
  isProduction: boolean
) => {
  validateOptionsOrThrow(options)
  const { method, retries = 3, expression, name } = options
  let baseUrl = IS_VERCEL ? `https://${VERCEL_URL}` : BASE_URL

  if (checkStringForSlashes(name)) {
    throw new Error(SLASH_ERROR_MESSAGE)
  }
  let target = options.target

  const metadata = await useMetadata(isProduction)
  const proxy = metadata['proxy']

  if (proxy) {
    baseUrl = `${proxy}`
  }

  if (!baseUrl) {
    throw new Error(
      `No baseUrl found for cron. If you create a local production build please set a SLSQ_BASE_URL in your .env.local file. If you deploy to Vercel this is set automatically within your pipeline.`
    )
  }

  if (isValidUrl(options.target)) {
    throw new Error(
      'Please use only relative paths for cron targets; We will add the proxy for you. Please refer to the docs for more information.'
    )
  }

  const cronTarget = options.target.replace(/^\//g, '')
  target = `${baseUrl}/${cronTarget}`

  logVerbose(
    '[ServerlessQ] setting cron target to',
    target,
    'from',
    options.target
  )

  try {
    const resp = await http.post<Cron>(`/crons/${name}`, {
      method,
      target,
      retries,
      cronExpression: expression
    })
    console.info(
      '[ServerlessQ] Cron created with id',
      resp.data.id,
      'and name',
      name
    )

    return resp.data
  } catch (error) {
    return createError(error, 'could not create or update cron')
  }
}

export const deleteCron = async (nameOfCron: string) => {
  try {
    const resp = await http.delete<void>(`/crons/${nameOfCron}`)
    logVerbose(`[ServerlessQ] Cron ${nameOfCron} deleted`)

    return resp.data
  } catch (error) {
    if (checkIfResourcesConflictError(error)) {
      console.log(
        `Cron ${nameOfCron} not deleted as it is currently in creation`
      )
      return createError(error, 'Cron is currently in creation')
    }
    return createError(error, 'could not delete cron')
  }
}

const validateOptionsOrThrow = (options: CronOptions) => {
  if (!options.target || !options.method || !options.expression) {
    throw new Error(OPTIONS_ERROR_MESSAGE)
  }
}
