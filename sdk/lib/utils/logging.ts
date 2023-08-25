import { __VERBOSE__ } from './constants'

/**
 * Will only log the message if SLSQ_VERBOSE is set to true
 * @param message - the message to log
 */
export const logVerbose = (...messages: (string | Error | unknown)[]) => {
  if (__VERBOSE__) {
    console.log(...messages)
  }
}
