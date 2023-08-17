import { expect, it, describe } from 'vitest'
import { extractMetaFromFilename, parseFile } from './parser'

const queue_string =
  "import { Queue } from '@serverlessq/nextjs'\n\nexport default Queue({\n    options: {\n        retries: 3\n    },\n    handler: async (req, res) => {\n        res.status(200).json({ name: 'John Doe' })\n    }\n})"
const cron_string =
  "import { Cron } from '@serverlessq/nextjs'\n\nexport default Cron({\n    options: {\n  retries: 3,\n        expression: '*/1 * * * *'\n    },\n    handler: async (req, res) => {\n        res.status(200).json({ name: 'John Doe' })\n    }\n})"

const skip_string =
  "import { NextApiRequest, NextApiResponse } from 'next'; export default function handler(req: NextApiRequest, res: NextApiResponse) { res.status(200).json({ name: 'John Doe' }); }"

const valid_queue_string =
  "import { Queue } from '@serverlessq/nextjs'; export default Queue({ options: { retries: 2 }, handler: async (req, res) => { res.status(200).json({ name: 'John Doe' }) }})"

describe('parseFile', () => {
  it('should parse a valid string', () => {
    const ast = parseFile({
      fileContent: valid_queue_string,
      isProduction: false,
      fileName: '/index/api/hello.ts'
    })
    expect(ast?.type).toBe('queue')
    expect(ast?.options).toStrictEqual({
      retries: 2
    })
    expect(ast?.name).toBe('DEV_hello')
    expect(ast?.route).toBe('/api/hello')
  })

  it('should parse a file', () => {
    const ast = parseFile({
      fileContent: queue_string,
      isProduction: false,
      fileName: '/index/api/hello.ts'
    })
    expect(ast?.type).toBe('queue')
    expect(ast?.options).toStrictEqual({
      retries: 3
    })
    expect(ast?.name).toBe('DEV_hello')
    expect(ast?.route).toBe('/api/hello')
  })

  it('should add a production prefix', () => {
    const ast = parseFile({
      fileContent: cron_string,
      isProduction: true,
      fileName: '/index/api/v1/cron.ts'
    })
    expect(ast?.type).toBe('cron')
    expect(ast?.options).toStrictEqual({
      expression: '*/1 * * * *',
      retries: 3
    })
    expect(ast?.name).toBe('cron')
    expect(ast?.route).toBe('/api/v1/cron')
  })

  it('should return undefined for invalid file', () => {
    const ast = parseFile({
      fileContent: skip_string,
      isProduction: true,
      fileName: ''
    })
    expect(ast).toBeUndefined()
  })
})

describe('extractMetaFromFilename', () => {
  it('should extract the route from the current filepath', () => {
    // given
    const filePath = '/index/api/hello.ts'
    // when
    const route = extractMetaFromFilename(filePath).route
    // then
    expect(route).toBe('/api/hello')
  })
  it('should a deep nested the route from the current filepath', () => {
    // given
    const filePath = '/index/api/v3/newsletter/times/hello.ts'
    // when
    const route = extractMetaFromFilename(filePath).route
    // then
    expect(route).toBe('/api/v3/newsletter/times/hello')
  })
  it('should take .js files into account', () => {
    // given
    const filePath = '/index/api/hello.js'
    // when
    const route = extractMetaFromFilename(filePath).route
    // then
    expect(route).toBe('/api/hello')
  })
  it('should parse the meta from a given filepath', () => {
    // given
    const filePath =
      'eval (webpack-internal:///./pages/api/image-queue.ts:13:124)'

    // when
    const { name, route } = extractMetaFromFilename(filePath)

    // then
    expect(name).toBe('image-queue')
    expect(route).toBe('/api/image-queue')
  })
})
