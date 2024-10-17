import { type CreateConfigParameters } from "@wagmi/core";
import { http } from "wagmi";
import {
  arbitrum,
  base,
  Chain,
  linea,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import { CoinbaseWalletParameters } from "wagmi/connectors";

import defaultConnectors from "./defaultConnectors";

// TODO: Move these to a provider rather than global variable
let globalAppName: string;
let globalAppIcon: string;
export const getAppName = () => globalAppName;
export const getAppIcon = () => globalAppIcon;

type DefaultConfigProps = {
  appName: string;
  appIcon?: string;
  appDescription?: string;
  appUrl?: string;

  // WC 2.0 requires a project ID (get one here: https://cloud.walletconnect.com/sign-in)
  walletConnectProjectId: string;
  // Coinbase Wallet preference
  coinbaseWalletPreference?: CoinbaseWalletParameters<"4">["preference"];
} & Partial<CreateConfigParameters>;

export const REQUIRED_CHAINS: CreateConfigParameters["chains"] = [
  mainnet,
  base,
  polygon,
  optimism,
  arbitrum,
  linea,
  sepolia,
];

const defaultConfig = ({
  appName = "Daimo Pay",
  appIcon,
  appDescription,
  appUrl,
  walletConnectProjectId,
  coinbaseWalletPreference,
  chains = REQUIRED_CHAINS,
  client,
  ...props
}: DefaultConfigProps): CreateConfigParameters => {
  globalAppName = appName;
  if (appIcon) globalAppIcon = appIcon;

  const paddedChains: [Chain, ...Chain[]] = [...chains];
  for (const chain of REQUIRED_CHAINS) {
    if (!paddedChains.includes(chain)) {
      paddedChains.push(chain);
    }
  }

  const paddedTransports: CreateConfigParameters["transports"] = {};
  for (const chain of paddedChains) {
    if (!props?.transports?.[chain.id]) {
      // Auto inject http transport if not provided for a chain
      paddedTransports[chain.id] = http();
    } else {
      paddedTransports[chain.id] = props.transports[chain.id];
    }
  }

  const connectors: CreateConfigParameters["connectors"] =
    props?.connectors ??
    defaultConnectors({
      app: {
        name: appName,
        icon: appIcon,
        description: appDescription,
        url: appUrl,
      },
      walletConnectProjectId,
      coinbaseWalletPreference,
    });

  const config: CreateConfigParameters<any, any> = {
    ...props,
    chains: paddedChains,
    transports: paddedTransports,
    connectors,
  };

  return config;
};

export default defaultConfig;
