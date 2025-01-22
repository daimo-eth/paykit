import {
  coinbaseWallet,
  CoinbaseWalletParameters,
  injected,
  safe,
  walletConnect,
} from "@wagmi/connectors";
import { CreateConnectorFn } from "wagmi";

type DefaultConnectorsProps = {
  app: {
    name: string;
    icon?: string;
    description?: string;
    url?: string;
  };
  walletConnectProjectId: string;
  coinbaseWalletPreference?: CoinbaseWalletParameters<"4">["preference"];
  additionalConnectors?: CreateConnectorFn[];
};

const defaultConnectors = ({
  app,
  walletConnectProjectId,
  coinbaseWalletPreference,
  additionalConnectors,
}: DefaultConnectorsProps): CreateConnectorFn[] => {
  const hasAllAppData = app.name && app.icon && app.description && app.url;
  const shouldUseSafeConnector =
    !(typeof window === "undefined") && window?.parent !== window;

  const connectors: CreateConnectorFn[] = additionalConnectors ?? [];

  // If we're in an iframe, include the SafeConnector
  if (shouldUseSafeConnector) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
      }),
    );
  }

  // Add the rest of the connectors
  connectors.push(
    injected({ target: "metaMask" }),
    coinbaseWallet({
      appName: app.name,
      appLogoUrl: app.icon,
      overrideIsMetaMask: false,
      preference: coinbaseWalletPreference,
    }),
  );

  connectors.push(
    walletConnect({
      showQrModal: false,
      projectId: walletConnectProjectId,
      metadata: hasAllAppData
        ? {
            name: app.name,
            description: app.description!,
            url: app.url!,
            icons: [app.icon!],
          }
        : undefined,
    }),
  );

  /*
  connectors.push(
    injected({
      shimDisconnect: true,
    })
  );
  */

  return connectors;
};

export default defaultConnectors;
