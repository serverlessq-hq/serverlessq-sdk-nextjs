import { Queue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Queue({
  options: {
    name: "hello",
    route: "api/hello",
    retries: 3,
  },
  handler: async (_req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({ name: "John Doe" });
  },
});
