// @refresh reload
import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
import { FileRoutes, Head, Meta, Scripts, Title } from "solid-start";
export default function Root() {
  return (
    <html lang="en">
      <Head>
        <Title>SolidStart - With Vitest</Title>
        <Meta charset="utf-8" />
        <link rel="stylesheet" href="https://unpkg.com/m-@1.4.0/dist/min.css" />
        <script defer src="https://unpkg.com/m-@1.4.0/dist/min.js"></script>
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        <ErrorBoundary>
          <Suspense>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  );
}
