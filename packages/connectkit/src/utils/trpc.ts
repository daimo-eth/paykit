import type { AppRouter } from "@daimo/pay-api";
import {
  CreateTRPCClient,
  createTRPCClient,
  httpBatchLink,
} from "@trpc/client";
import { daimoPayVersion } from "./exports";

export type TrpcClient = CreateTRPCClient<AppRouter>;

export function createTrpcClient(apiUrl: string): TrpcClient {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: apiUrl,
        headers: {
          "x-pay-version": daimoPayVersion,
        },
      }),
    ],
  });
}
