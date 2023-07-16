export const OPTIONS_ERROR_MESSAGE = 'required options are missing'
export const SLASH_ERROR_MESSAGE = 'name cannot contain slashes'
export const LOCAL_DEVELOPMENT_ERROR =
  'Not running on Vercel. If your developing with localhost please add the `urlToOverrideWhenRunningLocalhost` flag to the queue options'
export const VERCEL_URL = process.env.VERCEL_URL
export const IS_VERCEL = process.env.VERCEL
export const ENV_ERROR_MESSAGE =
  'Please set the environment variable SERVERLESSQ_API_TOKEN'
export const __VERBOSE__ = process.env.SLSQ_VERBOSE === 'true';
