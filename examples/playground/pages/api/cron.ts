import { Cron } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Cron({
    handler: async (_req: NextApiRequest, res: NextApiResponse) => {
        res.status(200).json({ name: 'John Doe' })
    },
    options: {
        expression: "0 */10 * * ? *",
        retries: 3,
        method: "GET",
        name: "hello",
        target: "api/cron"
    }
});