import axios from 'axios'
import { ENV_ERROR_MESSAGE, __VERBOSE__ } from './constants'

export const createError = (error: Error | any, origin: string) => {
  if (__VERBOSE__) {
    console.log(`Error while ${origin}`, error)
  }
  if (axios.isAxiosError(error)) {
    throw new Error(`${origin} | ${error.message}`)
  } else throw new Error(origin)
}

export const checkIfResourcesConflictError = (error: Error | any) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) {
      return true
    }
  }
  return false
}
const API_KEY = process.env.SERVERLESSQ_API_TOKEN

const nodeEnvToURL = {
  development: 'https://h7m87enp08.execute-api.us-east-2.amazonaws.com/prod',
  production: 'https://api.serverlessq.com/'
}

export const http = axios.create({
  baseURL: nodeEnvToURL.production,
  timeout: 10000
})

http.interceptors.request.use(config => {
  if (!API_KEY) {
    throw new Error(ENV_ERROR_MESSAGE)
  }

  config.headers!['x-api-key'] = API_KEY
  return config
})

http.defaults.headers.common['Accept'] = 'application/json'
http.defaults.headers.post['Content-Type'] = 'application/json'
