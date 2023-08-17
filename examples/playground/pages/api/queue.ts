import { Queue } from "@serverlessq/nextjs";

export default Queue({
  options: {
    retries: 3,
  },
  handler: async (_req, res) => {
    console.log("Hello from the queue!")
    res.status(200).json({ name: "John Doe" });
  },
});
