import React from "react";

import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { useWallet } from "@solana/wallet-adapter-react";
import Button from "../../../Common/Button";
import OptionsList from "../../../Common/OptionsList";
import { OrderHeader } from "../../../Common/OrderHeader";
import { ROUTES, usePayContext } from "../../../DaimoPay";

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

  return (
    <PageContent>
      <OrderHeader minified />

      {solanaWallets.wallets.length === 0 && (
        <ModalContent
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
            paddingBottom: 16,
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

      <OptionsList options={options} />
    </PageContent>
  );
};

const SquircleIcon = ({ icon, alt }: { icon: string; alt: string }) => (
  <div style={{ borderRadius: "22.5%", overflow: "hidden" }}>
    <img src={icon} alt={alt} />
  </div>
);

export default ConnectSolana;
