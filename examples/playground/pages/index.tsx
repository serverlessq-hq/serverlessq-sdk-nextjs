import ImageQueue from './api/image-queue'

export async function getServerSideProps(
) {
  const result = await ImageQueue.enqueue({
    method: "POST",
    body: { email: "test@mail.com" },
  });

  return {
    props: {
      result,
    }, // will be passed to the page component as props
  }
}

export default function Home(props: any) {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="flex flex-col gap-10 z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="flex items-center w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Serverlessq SDK for NextJS&nbsp;
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          Your queue result: {JSON.stringify(props.result)}
        </div>
      </div>
    </main>
  );
}
