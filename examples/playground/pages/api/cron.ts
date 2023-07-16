import { Cron } from "@serverlessq/nextjs";

export default Cron({
    handler: async (_req, res) => {
        res.status(200).json({ name: 'John Doe' })
    },
    options: {
        expression: "0 */10 * * ? *",
        retries: 3,
        method: "GET",
        name: "hello",
        target: "https://tame-boxes-roll.loca.lt/api/cron"
    }
});