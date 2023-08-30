import { enqueue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await enqueue({
    method: "GET",
    queueId: "bd609bd7-40fc-4523-83c7-4a673507fc53",
    target: "https://mock.codes/200",
  });

  console.log("results: ", results)

  return res.send(results);
}
