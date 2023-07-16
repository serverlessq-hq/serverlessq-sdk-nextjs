import {AST_NODE_TYPES, parse, type TSESTree } from '@typescript-eslint/typescript-estree'
import { CronOptions } from '../cron'
import { QueueOptions } from '../queue/handler-next'
import { __VERBOSE__ } from './constants'

export type ParseFileResponse =
  | { type: 'cron', options: CronOptions }
  | { type: 'queue', options: QueueOptions }

export const parseFile = (params: { file: string, isProduction: boolean }): ParseFileResponse | undefined => {
    const ast = parse(params.file)
    try {
        const declaration = (ast.body.find((node): node is TSESTree.ExportDefaultDeclaration => node.type === AST_NODE_TYPES.ExportDefaultDeclaration))?.declaration;
    
        // @ts-ignore
        const type = declaration?.callee?.name?.toLowerCase() ?? '' as 'cron' | 'queue'
        const PREFIX = params.isProduction ? '' : 'DEV_'
    
        if(!['cron', 'queue'].includes(type)) return; 

        // @ts-ignore
        const options = declaration?.arguments?.[0].properties.find((prop: any) => prop.key.name === 'options').value.properties.reduce((acc: any, node: any) => {
            acc[node.key.name] = node.value.value
            return acc
        }, {})
        
        if(!type || !options) return;
        
        return {
            type,
            options: { ...options, name: `${PREFIX}${options.name}` }
        }
    }catch(e) {
        if(__VERBOSE__) console.log('[ServerlessQ] Error while parsing file to get config', e)

        return undefined
    }
}

