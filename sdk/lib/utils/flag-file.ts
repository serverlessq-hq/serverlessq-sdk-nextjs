import * as fs from 'fs'
import path from 'path'
import { KV } from '../types'
import { PROCESS_END_EVENTS } from './constants'
import { logVerbose } from './logging'

const NEXT_PATH = path.join(process.cwd(), '.next', 'static')
const FILE_NAME = (isProduction: Boolean) =>
  `.serverlessq-config${isProduction ? '.production' : ''}.json`

const getAccessibleFile = (isProduction: Boolean) =>
  isProduction
    ? path.join(NEXT_PATH, FILE_NAME(isProduction))
    : getFlagFile(isProduction)

export const getFlagFile = (isProduction: Boolean) =>
  path.join(process.cwd(), FILE_NAME(isProduction))

const createUnlinkListener = () => {
  for (const event of PROCESS_END_EVENTS) {
    process.on(event, removeFlagFile)
  }
}

const removeFlagFile = (isProduction: Boolean) => {
  if (fs.existsSync(getFlagFile(isProduction)))
    fs.unlink(getFlagFile(isProduction), err => {
      if (err) {
        console.error(
          `[ServerlessQ] Error deleting flag file. Please check for a ${getFlagFile(
            isProduction
          )} in your root and delete it manually.`
        )
      }
    })
}

/**
 *  Creates a flag file to stop NextJS from running the plugin multiple times
 */
export const ensureSingleExecution = async (params: {
  onExecution: Function
  isProduction: boolean
}) => {
  const FLAG_FILE = getFlagFile(params.isProduction)
  // ensure dev process does not start with a flag file
  logVerbose(
    `[ServerlessQ] Detected no production execution. Using config file ${FLAG_FILE}`
  )

  if (!fs.existsSync(FLAG_FILE)) {
    fs.writeFileSync(FLAG_FILE, '')

    logVerbose(`[ServerlessQ] Creating config file ${FLAG_FILE}`)
  } else {
    logVerbose(
      `[ServerlessQ] Config file ${FLAG_FILE} already exists, purging it`
    )

    // purge the file
    fs.truncateSync(FLAG_FILE, 0)
  }

  process.on('SIGINT', () => {
    if (!params.isProduction && fs.existsSync(FLAG_FILE)) {
      fs.unlinkSync(FLAG_FILE)
    }
  })

  await params.onExecution()
  // deployed version needs a lookup for the flag file
  if (!params.isProduction) {
    createUnlinkListener()
  }
}

// This is a hacky way to store metadata and very slow. It is necessary as the are different node processes running
export const setMetadata = async (params: KV, isProduction: boolean) => {
  const FLAG_FILE = getAccessibleFile(isProduction)
  const file = await fs.promises.readFile(FLAG_FILE, 'utf-8')

  const crtMetadata = file ? JSON.parse(file || '{}') : {}
  const stringified = JSON.stringify(Object.assign(crtMetadata, params))

  await fs.promises.writeFile(FLAG_FILE, stringified)
}

export const useMetadata = async (isProduction: boolean) => {
  try {
    logVerbose('[ServerlessQ] Reading config file')
    logVerbose(
      '[ServerlessQ] Found config file',
      getAccessibleFile(isProduction)
    )

    const file = await fs.readFileSync(getAccessibleFile(isProduction), 'utf-8')

    const metadata = file ? file : '{}'
    return JSON.parse(metadata) as Partial<KV>
  } catch (_) {
    logVerbose('[ServerlessQ] No metadata found')
    return {}
  }
}
