export const OPTIONS_ERROR_MESSAGE = 'required options are missing'
export const SLASH_ERROR_MESSAGE = 'name cannot contain slashes'
export const LOCAL_DEVELOPMENT_ERROR =
  'Not running on Vercel. If your developing with localhost please add the `urlToOverrideWhenRunningLocalhost` flag to the queue options'
export const VERCEL_URL = process.env.VERCEL_URL
export const BASE_URL = process.env.SLSQ_BASE_URL
export const IS_VERCEL = process.env.VERCEL
export const ENV_ERROR_MESSAGE =
  'Please set the environment variable SERVERLESSQ_API_TOKEN'

export const __VERBOSE__ = process.env.SLSQ_VERBOSE === 'true'
export const PROCESS_END_EVENTS = [
  'uncaughtException',
  'unhandledRejection',
  'SIGINT',
  'SIGTERM'
]

export const checkForEnvVariables = (isProduction: boolean) => {
  if (!process.env.SERVERLESSQ_API_TOKEN) {
    throw new Error(ENV_ERROR_MESSAGE)
  }

  if (isProduction) {
    if (!VERCEL_URL && !BASE_URL) {
      throw new Error(
        'Please set the environment variable VERCEL_URL if running on Vercel or SLSQ_BASE_URL if running on another platform'
      )
    }
  }
}
