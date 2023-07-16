import { Queue } from '@serverlessq/nextjs'

export default Queue({
    options: {
        name: 'hello',
        route: '/api/hello',
        retries: 3
    },
    handler: async (_req, res) => {
        res.status(200).json({ name: 'John Doe' })
    }
})