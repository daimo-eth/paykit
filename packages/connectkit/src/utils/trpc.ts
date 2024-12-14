import type { AppRouter } from "@daimo/pay-api";
import {
  CreateTRPCClient,
  createTRPCClient,
  httpBatchLink,
} from "@trpc/client";

export type TrpcClient = CreateTRPCClient<AppRouter>;

export function createTrpcClient(apiUrl: string): TrpcClient {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: apiUrl,
      }),
    ],
  });
}
