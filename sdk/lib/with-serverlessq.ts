import { addCleanupListener } from 'async-cleanup'
import CopyPlugin from 'copy-webpack-plugin'
import localtunnel from 'localtunnel'
import { NextConfig } from 'next'
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER
} from 'next/constants'
import { WebpackConfigContext } from 'next/dist/server/config-shared'
import { SlsqDetector } from './slsq-detector'
import { isProduction } from './utils'
import { checkForEnvVariables } from './utils/constants'
import {
  ensureSingleExecution,
  getFlagFile,
  setMetadata
} from './utils/flag-file'
import { logVerbose } from './utils/logging'

const watchModePhases = [
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER
]
type Phase = typeof watchModePhases[number]

/**
 * Registers the cron/queue detector
 * @param phase Next.js phase to determine if we're in production or not
 */
async function registerDetector(phase: Phase) {
  const __IS_PROD__ = isProduction(phase)
  const detector = SlsqDetector.getInstance({ isProduction: __IS_PROD__ })
  await detector.awaitReady()

  if (__IS_PROD__) {
    await detector.close()
    return
  }
  addCleanupListener(async () => {
    logVerbose(`[ServerlessQ] Cleaning up ServerlessQ resources`)

    try {
      await detector.deleteOnEndEvent()
      logVerbose(`[ServerlessQ] ServerlessQ resources cleaned up`)
    } catch {
      logVerbose(
        `[ServerlessQ] Could not clean up dev resources, please delete them manually`
      )
    }

    process.exit(0)
  })

  return
}

async function registerProxy(isProd: boolean) {
  const tunnel = await localtunnel({ port: 3000 })
  await setMetadata({ ['proxy']: tunnel?.url }, isProd)
}

export const withServerlessQ =
  (nextConfig: NextConfig) => async (phase: Phase) => {
    const isProd = isProduction(phase)

    console.info(
      `[ServerlessQ] starting in ${isProd ? 'production' : 'development'} mode`
    )

    const FLAG_FILE = getFlagFile(isProd)

    await ensureSingleExecution({
      onExecution: async () => {
        logVerbose(
          '[ServerlessQ] Starting ServerlessQ plugin with verbose logs'
        )

        checkForEnvVariables(isProd)

        if (phase === PHASE_DEVELOPMENT_SERVER) {
          await registerProxy(isProd)
          console.info('[ServerlessQ] Started local proxy')
        }

        if (watchModePhases.includes(phase)) {
          await registerDetector(phase)
        }
      },
      isProduction: isProd
    })

    return Object.assign({}, nextConfig, {
      webpack(config: any, options: WebpackConfigContext) {
        if (!options.isServer && !options.dev) {
          config.plugins.push(
            new CopyPlugin({
              patterns: [
                {
                  from: FLAG_FILE,
                  to: 'static'
                }
              ]
            })
          )
        }

        config.module.rules.push({
          test: /\.node$/,
          loader: 'node-loader'
        })

        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options)
        }

        return config
      }
    })
  }
