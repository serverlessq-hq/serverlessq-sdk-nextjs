import {
  AST_NODE_TYPES,
  parse,
  type TSESTree
} from '@typescript-eslint/typescript-estree'
import { CronOptions } from '../cron'
import { QueueOptions } from '../queue/handler-next'
import { __VERBOSE__ } from './constants'
import path from 'path'

export type ParseFileResponse =
  | { type: 'cron'; name: string; route: string; options: CronOptions }
  | { type: 'queue'; name: string; route: string; options: QueueOptions }

export const parseFile = (params: {
  fileContent: string
  fileName: string
  isProduction: boolean
}): ParseFileResponse | undefined => {
  const ast = parse(params.fileContent)
  try {
    const declaration = ast.body.find(
      (node): node is TSESTree.ExportDefaultDeclaration =>
        node.type === AST_NODE_TYPES.ExportDefaultDeclaration
    )?.declaration

    // @ts-ignore-
    const type = declaration?.callee?.name?.toLowerCase() ?? ('' as 'cron' | 'queue')
    const PREFIX = params.isProduction ? '' : 'DEV_'

    if (!['cron', 'queue'].includes(type)) return

    // @ts-ignore
    const options = declaration?.arguments?.[0].properties
      .find((prop: any) => prop.key.name === 'options')
      .value.properties.reduce((acc: any, node: any) => {
        acc[node.key.name] = node.value.value
        return acc
      }, {})

    if (!type || !options) return

    return {
      type,
      name: `${PREFIX}${path.parse(params.fileName).name}`,
      route: extractMetaFromFilename(params.fileName).route,
      options
    }
  } catch (e) {
    if (__VERBOSE__)
      console.log('[ServerlessQ] Error while parsing file to get config', e)

    return undefined
  }
}

export const extractMetaFromFilename = (filename: string | undefined) => {
  if (!filename) throw new Error('No filename provided')

  const apiIndex = filename.indexOf('/api/')

  if (apiIndex !== -1) {
    const routeWithExtension = filename.slice(apiIndex)
    const route = routeWithExtension.split(/\.ts|\.js/)[0]
    return {
      route,
      name: route.split('/').at(-1) ?? ''
    }
  }

  throw new Error(`Could not extract route from filename ${filename}`)
}
