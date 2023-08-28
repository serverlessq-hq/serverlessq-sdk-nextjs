import { enqueue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await enqueue({
    method: "GET",
    queueId: "0a0c6dc4-6451-4079-8d01-033ca43ff458",
    target: "https://mock.codes/200",
  });

  console.log("results: ", results)

  return res.send(results);
}
