import * as chokidar from 'chokidar'
import { createHash } from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { deleteCron, upsertCron } from './cron/client'
import { deleteQueue, upsertQueue } from './queue/client'
import { __VERBOSE__ } from './utils/constants'
import { ParseFileResponse, parseFile } from './utils/parser'

export class SlsqDetector {
  private static instance: SlsqDetector
  private watcher: chokidar.FSWatcher
  private ready = false
  private cwd = process.cwd()
  private hashTable: Map<string, string> = new Map()

  private constructor(private isProduction: boolean) {
    this.watcher = chokidar.watch(['**/api/**/*.{ts,js}'], {
      ignored: ['node_modules', '**/node_modules', '.next/**'],
      cwd: this.cwd,
      awaitWriteFinish: true
    })
    this.watcher.on('add', this.on('added'))
    this.watcher.on('change', this.on('changed'))
    this.watcher.on('unlink', this.on('deleted'))
    this.watcher.on('ready', async () => {
      this.ready = true
    })
  }

  public static getInstance(params: { isProduction: boolean }): SlsqDetector {
    if (!SlsqDetector.instance) {
      SlsqDetector.instance = new SlsqDetector(params.isProduction)
    }

    return SlsqDetector.instance
  }

  public async close() {
    await this.watcher.close()
  }

  public async awaitReady() {
    if (this.ready) {
      return
    }

    await new Promise(resolve => {
      this.watcher.on('ready', resolve)
    })
  }
  public async deleteOnEndEvent() {
    const promises = new Array<Promise<void>>()

    this.hashTable.forEach(async (_, filePath) => {
      if (filePath) {
        const content = await fs.readFile(
          path.join(this.cwd, filePath),
          'utf-8'
        )
        const slsqConfig = parseFile({
          fileContent: content,
          fileName: filePath,
          isProduction: this.isProduction
        })
        if (!slsqConfig) {
          if (__VERBOSE__)
            console.log(
              `[ServerlessQ] No ServerlessQ config found in ${filePath}`
            )
          return Promise.resolve()
        }
        promises.push(this.onDeleted(slsqConfig))
      }
    })
    return await Promise.all(promises)
  }

  private async onDeleted(params: ParseFileResponse) {
    if (!this.isProduction) {
      if (__VERBOSE__) {
        console.log(`Deleting ${params.type} ${params.options.name}`)
      }
      if (params.type === 'cron') {
        await deleteCron(params.options.name)
      }
      if (params.type === 'queue') {
        await deleteQueue(params.options.name)
      }
    }
  }

  private async onChanged(params: ParseFileResponse) {
    try {
      if (params.type === 'cron') {
        await upsertCron({
          name: params.name,
          expression: params.options.expression,
          method: params.options.method,
          retries: params.options.retries,
          target: params.route
        })
      }
      if (params.type === 'queue') {
        await upsertQueue({
          name: params.name,
          route: params.route,
          retries: params.options.retries
        })
      }
    } catch (error) {
      if (__VERBOSE__) {
        console.log(
          `Error while creating a ${params.type} for ServerlessQ`,
          error
        )
      }
    }
  }

  private on(fileChangeType: 'changed' | 'deleted' | 'added') {
    return async (filePath: string) => {
      const currentRouteHash = this.hashTable.get(filePath)
      const newContent = await fs.readFile(
        path.join(this.cwd, filePath),
        'utf-8'
      )
      const slsqConfig = parseFile({
        fileContent: newContent,
        fileName: filePath,
        isProduction: this.isProduction
      })

      const newRouteHash = this.toHash(newContent)

      if (currentRouteHash === newRouteHash) {
        if (__VERBOSE__)
          console.log(
            `[ServerlessQ] No ${fileChangeType} detected in ${filePath}`
          )
        return
      }

      if (!slsqConfig) {
        if (__VERBOSE__)
          console.log(
            `[ServerlessQ] No ServerlessQ config found in ${filePath}`
          )
        return
      }

      switch (fileChangeType) {
        case 'changed':
        case 'added': {
          this.hashTable.set(filePath, newRouteHash)

          await this.onChanged(slsqConfig)
          break
        }

        case 'deleted': {
          if (currentRouteHash) {
            await this.onDeleted(slsqConfig)
            this.hashTable.delete(filePath)
          }
          break
        }
        default:
          throw new Error(`Unknown file change type: ${fileChangeType}`)
      }
    }
  }

  private toHash(str: string) {
    const buffer = Buffer.from(str, 'utf-8')
    return createHash('sha256').update(buffer).digest('hex')
  }
}
