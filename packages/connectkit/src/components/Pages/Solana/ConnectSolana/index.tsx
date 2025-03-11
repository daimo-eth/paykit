import React from "react";

import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { useWallet } from "@solana/wallet-adapter-react";
import { Phantom, Solflare } from "../../../../assets/logos";
import { isMobile } from "../../../../utils";
import Button from "../../../Common/Button";
import OptionsList from "../../../Common/OptionsList";
import { ROUTES, usePayContext } from "../../../DaimoPay";
interface Option {
  id: string;
  title: string;
  subtitle?: string;
  icons: (React.ReactNode | string)[];
  onClick: () => void;
  disabled?: boolean;
}
const ConnectSolana: React.FC = () => {
  const { setSolanaConnector, setRoute } = usePayContext();
  const solanaWallets = useWallet();

  const options = solanaWallets.wallets.map((wallet) => ({
    id: wallet.adapter.name,
    title: `${wallet.adapter.name}`,
    icons: [
      <SquircleIcon icon={wallet.adapter.icon} alt={wallet.adapter.name} />,
    ],
    onClick: async () => {
      console.log("wallet.adapter.name ", wallet.adapter.name);
      setSolanaConnector(wallet.adapter.name);
      if (solanaWallets.connected) {
        await solanaWallets.disconnect();
      }
      setRoute(ROUTES.SOLANA_CONNECTOR, {
        event: "click-solana-wallet",
        walletName: wallet.adapter.name,
      });
    },
  }));

  const defaultOptions: Option[] = [
    {
      id: "phantom",
      title: "Open in Phantom",
      icons: [
        <SquircleIcon
          icon={(props) => <Phantom {...props} background />}
          alt="Phantom"
        />,
      ],
      onClick: () =>
        window.open(
          `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`,
        ),
    },
    {
      id: "solflare",
      title: "Open in Solflare",
      icons: [
        <SquircleIcon
          icon={(props) => <Solflare {...props} background />}
          alt="Solflare"
        />,
      ],
      onClick: () =>
        window.open(
          `https://solflare.com/ul/v1/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`,
          "_blank",
        ),
    },
    // {
    //   id: "backpack",
    //   title: "Open in Backpack",
    //   icons: [
    //     <SquircleIcon
    //       icon={(props) => <Backpack {...props} background />}
    //       alt="Backpack"
    //     />,
    //   ],
    //   onClick: () =>
    //     window.open(
    //       `https://backpack.app/ul/v1/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`,
    //       "_blank",
    //     ),
    // },
  ];

  return (
    <PageContent
      style={{
        height: "100%",
      }}
    >
      {/* No wallets on desktop */}
      {solanaWallets.wallets.length === 0 && !isMobile() && (
        <ModalContent
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
            paddingBottom: 16,
            gap: 16,
          }}
        >
          <ModalH1>No Solana wallets detected.</ModalH1>
          <Button
            onClick={() =>
              setRoute(ROUTES.SELECT_METHOD, { event: "click-select-another" })
            }
          >
            Select Another Method
          </Button>
        </ModalContent>
      )}

      {/* Mobile wallet instructions - shown when no wallets or using mobile adapter */}
      {isMobile() &&
        (solanaWallets.wallets.length === 0 ||
          (solanaWallets.wallets.length > 0 &&
            solanaWallets.wallets[0].adapter.name ===
              "Mobile Wallet Adapter")) && (
          <ModalContent
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <OptionsList options={defaultOptions} />
          </ModalContent>
        )}

      {/* Show wallet options when not on mobile adapter */}
      {solanaWallets.wallets.length > 0 &&
        solanaWallets.wallets[0].adapter.name !== "Mobile Wallet Adapter" && (
          <OptionsList options={options} />
        )}
    </PageContent>
  );
};

const SquircleIcon = ({
  icon,
  alt,
}: {
  icon: string | React.ComponentType<any>;
  alt: string;
}) => {
  const IconComponent =
    typeof icon === "string" ? (
      <img src={icon} alt={alt} />
    ) : (
      React.createElement(icon)
    );

  return (
    <div style={{ borderRadius: "22.5%", overflow: "hidden" }}>
      {IconComponent}
    </div>
  );
};

export default ConnectSolana;
