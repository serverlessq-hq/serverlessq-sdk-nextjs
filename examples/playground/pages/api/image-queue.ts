import { Queue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Queue({
  options: {
    name: "image-queue",
    route: "api/image-queue",
    retries: 3,
  },
  handler: async (_req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json({ status: "Image transformed ✅" });
  },
});
