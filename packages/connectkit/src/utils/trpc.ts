// TODO: re-enable for dev only in rollup.
// import { AppRouter } from "@daimo/pay-api";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

// TODO: env var in build
export const apiUrl = "https://pay-api.daimo.xyz";

export const trpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: apiUrl,
    }),
  ],
}) as any;
