"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { DaimoPayProvider } from "@daimo/pay";
import { config } from "../config";

const apiUrl =
  process.env.NEXT_PUBLIC_DAIMOPAY_API_URL || "https://pay-api.daimo.xyz";

const queryClient = new QueryClient();
export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider payApiUrl={apiUrl} debugMode>
          {props.children}
        </DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
