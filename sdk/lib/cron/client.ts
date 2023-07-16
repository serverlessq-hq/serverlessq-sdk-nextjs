import {
  OPTIONS_ERROR_MESSAGE,
  SLASH_ERROR_MESSAGE,
  __VERBOSE__
} from '../utils/constants'
import { checkStringForSlashes } from '../utils/sanitize-input'
import { CronOptions } from './handler-next'
import { createError, http } from '../utils/axios'

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
    const { method, target, retries = 3, expression, name } = options

    if (checkStringForSlashes(name)) {
      throw new Error(SLASH_ERROR_MESSAGE)
    }

    try {
       const resp = await http.post<Cron>(`/crons/${name}`, {
        method,
        target,
        retries,
        cronExpression: expression
      })

      if(__VERBOSE__) {
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
