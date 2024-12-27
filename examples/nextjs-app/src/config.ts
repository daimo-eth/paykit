import { getDefaultConfig } from "@daimo/pay";
import { createConfig, http } from "wagmi";
import { arbitrum, mainnet, optimism, polygon } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    appName: "ConnectKit Next.js demo",
    chains: [mainnet, polygon, optimism, arbitrum],
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    transports: {
      [arbitrum.id]: http("https://arbitrum-one-rpc.publicnode.com"),
    },
  }),
);

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
