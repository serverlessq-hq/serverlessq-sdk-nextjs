import { Queue } from "@serverlessq/nextjs";

// TODO: Type errors -> Maybe peer dep version?
// async function handler(req: NextApiRequest, res: NextApiResponse) {
//   console.log("Message arrived!", req.body);
//   return res.status(200).json({ status: "Image transformed ✅ - 500 KB " });
// }

export default Queue({
  options: {
    name: "image-queue",
    route: "/api/image-queue",
  },
  handler: (req, res) => {
    console.log("Message arrived!", req.body);
    return;
  },
});
