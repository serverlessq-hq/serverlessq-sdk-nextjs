import { Queue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Queue({
  options: {
    name: "image-queue",
    route: "api/image-queue",
    retries: 3,
  },
  handler: async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("Message arrived!", req.body)
    res.status(200).json({ status: "Image transformed ✅" });
  },
});
