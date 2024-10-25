import React from "react";

import {
  DaimoPayOptions,
  DaimoPayProvider,
  getDefaultConfig,
} from "@daimo/pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";

const config = createConfig(
  getDefaultConfig({
    appName: "ConnectKit Next.js demo",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  }),
);

const queryClient = new QueryClient();

const options: DaimoPayOptions = {
  closeOnSuccess: true,
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider debugMode options={options}>
          {children}
        </DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
