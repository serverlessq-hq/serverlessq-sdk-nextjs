<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@serverlessq/nextjs">
    <img alt="" src="https://badgen.net/npm/v/@serverlessq/nextjs">
  </a>
  <a aria-label="License" href="https://github.com/vercel/swr/blob/main/LICENSE">
    <img alt="" src="https://badgen.net/npm/license/@serverlessq/nextjs">
  </a>
</p>

## Introduction

`@serverlessQ/nextjs` is a lightweight wrapper to easily utilize message queues and cron jobs from [ServerlessQ](https://serverlessq.com).

The version 2 has some amazing new features:

1. **Local file watcher**: Create your API route with your message queue. We will deploy them automatically to ServerlessQ. No need to leave your IDE!
2. **Local Proxy**: We've included a local proxy into the SDK. With that you receive enqueues messages and cron requests directly to your local machine. This brings your local machine even closer to production.
3. **Never leave your IDE:** Create queues and crons from code.

The SDK is specifically for Next.JS projects. If the projects are deployed to Vercel we make use of Vercel's environment variables. But the SDK also works on any other deployment provider!

ServerlessQ is the **missing piece** on Vercel to add asynchronous tasks!

> 🚧 You need to use Next.JS minimum 12.2. You can use the `enqueue` function with versions < 12.2, but you can't create new queues.

---

You can find the full docs for the SDK Version 2 [here](https://docs.serverlessq.com/sdks/next_2_0).

<br/>

## Installation

Install the library through your desired package manager

```bash
yarn add @serverlessq/nextjs
npm i @serverlessq/nextjs
pnpm i @serverlessq/nextjs
```

<br/>

## Environment Variables

### SERVERLESSQ_API_TOKEN

You need to set the `SERVERLESSQ_API_TOKEN` to connect your Next.JS project with ServerlessQ. The variable needs to be set during **build time**.

1. Create an account on [ServerlessQ](https://app.serverlessq.com) and follow the steps described in our [documentation](https://docs.serverlessq.com/sdks/javascript) to get the API token.
2. Go to the [dashboard](https://app.serverlessq.com/settings?tab=account), you will find your API token here

> 💡 If you application is deployed on Vercel, you can use our [Vercel Integration](https://vercel.com/integrations/serverlessq) to automate that task 🙂

If you want to use this library locally please create `.env.local` file with the following value:

```bash
SERVERLESSQ_API_TOKEN=
```

### Base URL

With the ServerlessQ SDK we forward the messages to the correct URL of your deployed Next.JS project. If the project is deployed on Vercel we make use of the `VERCEL_URL` as base url. For example:

`VERCEL_URL/api/queue`

If your project doesn't run on Vercel, simply set the environment variable `SLSQ_BASE_URL`.

```bash
SLSQ_BASE_URL=<your-production-url> # Example: SLSQ_BASE_URL=https://my-cool-project.com
```

We will use this to prefix your generated resources so that they will point to your production resources e.g. `https://my-cool-project.com/api/your-queue`

New for you? Go check out the official next.js docs on [how to create env files in NextJS](https://nextjs.org/docs/basic-features/environment-variables)

<br/>

## SDK Setup

Other than the environment variable there is only one more prerequisite to get the SDK running.

You need to add the function `withServerlessQ` in your `next.config.js` and wrap your next config with it.

```ts
const { withServerlessQ } = require("@serverlessq/nextjs");

module.exports = withServerlessQ({
  // your nextjs config
});
```

This will enable two things:

1. We run a local file watcher and deploy your newly created queues & cron jobs **automatically** to ServerlessQ. If they are created in development mode we prefix them with `DEV_`
2. We start a local proxy to allow you to receive enqueued messages and cron jobs on your local PC.

In order to keep track of what resources were created, we take advantage of a `.serverlessq-config.json` file for local development and `.serverlessq-config.production.json` for production builds. It is important to commit this file to your repository as it maps your created queue/cron id to the corresponding API function.

<!-- ![SDK](./assets/sdk.png) -->

# Creating Queues & Crons

Now let's see how to create Queues & Cron Jobs.

## Queues

Create a new [API Route](https://nextjs.org/docs/api-routes/introduction) within your Next.JS application, e.g. `pages/api/queue`.

You can have several queues in multiple queue functions.

```ts
// pages/api/queue
export default Queue({
  options: {
    name: "SendNewsletter",
    route: "api/queue",
    retries: 2,
  },
  handler: (req, res) => {
    return res.status(200).json({ name: "John Doe" });
  },
});
```

You need to define a few options:

- `name`: Unique in your ServerlessQ account
- `route`: The relative route to your queue (in this case it is `api/queue`)
- `retries`: How often should failed requests fail?
- `hander`: A function with the business logic that should be executed

<br/>

### Enqueue Jobs

You can now easily enqueue jobs by importing your created queue and call `.enqueue(...)`.

You can do this either from `getServerSideProps` or from another API function.

```ts
// pages/api/enqueue or getServerSideProps
import { NextApiRequest, NextApiResponse } from "next";
import testQueue from "./queue";

export default async function enqueue(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = await testQueue.enqueue({ method: "GET" });
  return res.json({ status: "success", ...result });
}
```

## Cron Jobs

Creating a Cron job is as easy as creating a queue.

```ts
// pages/api/cleanup
import { Cron } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Cron({
  handler: async (_req: NextApiRequest, res: NextApiResponse) => {
    console.log("Hello from the cron!");
    return res.status(200).json({ name: "John Doe" });
  },
  options: {
    name: "Clean up",
    expression: "0 */10 * * ? *",
    retries: 3,
    method: "GET",
  },
});
```

You need to set the following options:

- `name`: Unique name for your cron
- `expression`: Your cron schedule. Please follow this [syntax](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html?icmpid=docs_console_unmapped#cron-based)
- `method`: Which HTTP method should be used to call this handler?
- `retries`: How often should failed requests be retried?

<br/>

## Security

Every request from our service contains a specific header `x-serverlessq-signature`. This signature is a HMAC hash created from the request target and your API token. We use this signature to verify that the request is coming from our service. If you want to verify the request you can use our implementation `verifySignature` or write your own.

```ts
// pages/api/cleanup
import { verifySignature, Cron } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default Cron({
  handler: async (_req: NextApiRequest, res: NextApiResponse) => {
    if (!verifySignature(req, target)) {
      return res.status(401).json({ status: "Unauthorized" });
    }
    console.log("Hello from the cron!");
    return res.status(200).json({ name: "John Doe" });
  },
  options: {
    expression: "0 */10 * * ? *",
    retries: 3,
    method: "GET",
    name: "hello",
    target: "api/cron",
  },
});
```

## Working with Existing Queues

You have also the opportunity to work with existing queues. If you have created a queue from the ServerlessQ UI and simply want to forward messages you can do that.

```ts
// pages/api/existingQueue
import { enqueue } from "@serverlessq/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await enqueue({
      target: "/api/queue",
      method: "GET",
      queueId: "ID_OF_THE_QUEUE",
    });
    res.json({ status: "success", ...result });
  } catch (e) {
    res.json({ status: "failed" });
  }
}
```

You can use the `enqueue` function to directly enqueue a job to a certain `Queue-ID`. You find your queue ID in the [ServerlessQ Dashboard](https://app.serverlessq.com)

## Cleanup

We offer the possibility to clean up all dev resources when closing the development server. This happens by checking on different exit signals and deleting the resources when one is received. To enable this feature, update your `package.json` like this:

```json
{
  // ...
  "scripts": {
    "dev": "NEXT_MANUAL_SIG_HANDLE=true next dev", // <-- Add this
    "build": "next build",
    "start": "next start"
    // ...
  }
  // ...
}
```

## Types

We have full TypeScript support of course ✨

## Support

If you need help with anything join our [Discord server](https://discord.gg/XXR5TDEv4d) and hit us up! 💬

## Verbose Logs

If you encounter errors while using the SDK you can enable verbose logs by setting the environment variable `SLSQ_VERBOSE` to `true` in your `.env.local` file. This will give you more information about the error and the SDK lifecycle. Feel free to attach these logs to your support request.

<br/>

## Example Project

We have an example project in our [GitHub repository](https://github.com/serverlessq-hq/serverlessq-sdk-nextjs/tree/main/examples/playground)

## Port

If you're project runs another port than 3000 please start your dev server with the environment variable `PORT`. E.g. `PORT=4040 yarn dev`.

## Known Bugs

There are a few known bugs with Next.JS versions. Please try to use other versions.

- 13.1.6: Resources will be created multiple times.
- > 13.4.10: No shutdown command is executed - you can use this version, but your resources will not be cleaned up.

## License

The MIT License.
