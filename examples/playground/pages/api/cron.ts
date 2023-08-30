import { Cron } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Cron({
  handler: async (_req: NextApiRequest, res: NextApiResponse) => {
    console.log("Hello from the cron!");
    res.status(200).json({ name: "John Doe" });
  },
  options: {
    name: "NewsletterCro",
    expression: "0 */10 * * ? *",
    method: "GET",
  },
});
