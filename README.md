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

1. Local file watcher: Create your API route with your message queue. We will deploy them automatically to ServerlessQ. No need to leave your IDE!
2. Local Proxy: We've included a local proxy into the SDK. With that you receive enqueues messages and cron requests directly to your local machine. This brings your local machine even closer to production.
3. Create queues and crons from code.

The SDK is specifically for Next.JS projects. If the projects are deployed to Vercel we make use of Vercel's environment variables. But the SDK also works on any other deployment provider!

ServerlessQ is the **missing piece** on Vercel to add asynchronous tasks!

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

You need to set the `SERVERLESSQ_API_TOKEN` to connect your Next.JS project with ServerlessQ.

1. Create an account on [ServerlessQ](https://app.serverlessq.com) and follow the steps described in our [documentation](https://docs.serverlessq.com/sdks/javascript) to get the API token.
2. Go to the [dashboard](https://app.serverlessq.com/settings?tab=account), you will find your API token here

> 💡 If you application is deployed on Vercel, you can use our [Vercel Integration](https://vercel.com/integrations/serverlessq) to automate that task 🙂

If you want to use this library locally  please create `.env.local` file with the following value:

```bash
SERVERLESSQ_API_TOKEN=
```

For deployments outside of Vercel, also set above environment variable during build time. We will use it to create your resources when your project builds. 


If you want to host your project outside of Vercel and use the package, please set the `SLSQ_BASE_URL` variable pointing to your production URL, where your NextJS will run. 

```bash
SLSQ_BASE_URL=<your-production-url> # Example: SLSQ_BASE_URL=https://my-cool-project.com
``````

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


![SDK](./assets/sdk.png)

## Queue

### Create a Queue from an API Function

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
    return sres.status(200).json({ name: "John Doe" });
  },
});
```

<br/>

### Enqueue Jobs

You can now easily enqueue jobs by importing your created queue and simple call `.enqueue(...)`.

You can do this either from `getServerSideProps` or from another API function.

```ts
// pages/api/enqueue or getServerSideProps
import { NextApiRequest, NextApiResponse } from "next";
import testQueue from "./queue";

export default async function enqueue(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await testQueue.enqueue({ method: "GET" });
    res.json({ status: "success", ...result });
  } catch (e) {
    res.json({ status: "failed" });
  }
}
```

## Cron Jobs

### Create a Cronjob from an API Function

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
    expression: "0 */10 * * ? *",
    retries: 3,
    method: "GET",
    name: "hello",
    target: "api/cron",
  },
});
```

The `expressions` needs to follow the following syntax: [AWS Scheduler Syntax](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html?icmpid=docs_console_unmapped#cron-based).

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

## Types

We have full TypeScript support of course ✨

## Support

ServerlessQ runs on the cloud. That means if you work locally on a queue or cron a proxy is necessary to forward your request back to your local machine. In order to ease your life we create a local proxy (by using [localtunnel](https://localtunnel.me/)) for you once you start your development server with `next dev`. 

We offer the possibility to cleanup all dev resources when closing the development server. This happens by checking on different exit signals and deleting the resources when one is received. To enable this feature, update your package.json like this: 

```json
{
 // ...
   "scripts": {
        "dev": "NEXT_MANUAL_SIG_HANDLE=true next dev",  // <-- Add this
        "build": "next build",
        "start": "next start",
        // ...
    },
 // ...
}
```

[NEXT_MANUAL_SIG_HANDLE](https://nextjs.org/docs/pages/building-your-application/deploying#manual-graceful-shutdowns) let's us override the exit behavior of next development server so that we can execute the cleanup logic. 

If you do not add this, the development resources will persist after shutdown. Remember though, they will also add to your quota if there are called external for queues. C
Dev cron jobs will still be executed, but will result in errors, as they proxy to your dev machine does not exist anymore. 

Furthermore, the resources can take up to 15 seconds to be fully created. You can only delete the resources after they are created. 

If you need help with anything join our [Discord server](https://discord.gg/XXR5TDEv4d) and hit us up! 💬

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
      target: // TARGET URL,
      method: // HTTP METHOD,
      queueId: // QUEUE-ID,
    });
    res.json({ status: "success", ...result });
  } catch (e) {
    res.json({ status: "failed" });
  }
}
```

You can use the `enqueue` function to directly enqueue a job to a certain `Queue-ID`.

## Verbose Logs

If you encounter errors while using the SDK you can enable verbose logs by setting the environment variable `SLSQ_VERBOSE` to `true` in your `.env.local` file. This will give you more information about the error and the SDK lifecycle. Feel free to attach these logs to your support request.

## Milestone

- [x] Enqueue messages with ServerlessQ
- [x] Build Wrapper for Next.JS API Routes
- [x] Allow dynamic queue creation
- [x] Allow dynamic creation of cron jobs
- [x] Implement a local proxy for testing queues and crons
- [ ] Add the option for advanced queue options e.g. filter, tags

<br/>

## Example Project

We have an example project in our [GitHub repository](https://github.com/serverlessq-hq/serverlessq-sdk-nextjs/tree/main/examples/playground)

## License

The MIT License.
