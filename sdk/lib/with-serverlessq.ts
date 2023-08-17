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
import { __VERBOSE__ } from './utils/constants'
import {
  FLAG_FILE,
  ensureSingleExecution,
  setMetadata
} from './utils/flag-file'

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
  }

  return
}

async function registerProxy() {
  const tunnel = await localtunnel({ port: 3000 })
  if (__VERBOSE__) {
    console.log(`Started local proxy at: ${tunnel.url}`)
  }
  await setMetadata({ ['proxy']: tunnel?.url })
}

export const withServerlessQ =
  (nextConfig: NextConfig) => async (phase: Phase) => {
    await ensureSingleExecution({
      onExecution: async () => {
        if (__VERBOSE__) {
          console.log('Starting ServerlessQ plugin with verbose logs')
        }

        if (phase === PHASE_DEVELOPMENT_SERVER) {
          await registerProxy()
        }

        if (watchModePhases.includes(phase)) {
          await registerDetector(phase)
        }
      },
      isProduction: isProduction(phase)
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
          loader: "node-loader",
        });


        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options)
        }

        return config
      }
    })
  }
