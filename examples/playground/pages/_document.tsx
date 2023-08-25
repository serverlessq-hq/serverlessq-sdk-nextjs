import { serverlessQExit } from '@serverlessq/nextjs';
import { Html, Head, Main, NextScript } from 'next/document'

// this should be added in your custom _document
process.on("SIGTERM", () => {
  console.log("Received SIGTERM: ", "cleaning up");
  serverlessQExit(1);
});
process.on("SIGINT", () => {
  console.log("Received SIGINT: ", "cleaning up");
  serverlessQExit(1);
});


export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
