import { NextApiRequest, NextApiResponse } from "next";
import ImageQueue from "./image-queue";

export default async function enqueue(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await ImageQueue.enqueue({ method: "GET", body: {path:"URL"} });
  return res.send("OK");
}
