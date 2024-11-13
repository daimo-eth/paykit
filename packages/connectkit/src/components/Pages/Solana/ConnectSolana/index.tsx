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
import { ROUTES, useContext } from "../../../DaimoPay";

const ConnectSolana: React.FC = () => {
  const { setSolanaConnector, setRoute } = useContext();
  const wallets = useWallet();

  const options = wallets.wallets.map((wallet) => ({
    id: wallet.adapter.name,
    title: `${wallet.adapter.name}`,
    icons: [
      <SquircleIcon icon={wallet.adapter.icon} alt={wallet.adapter.name} />,
    ],
    onClick: () => {
      // TODO: Handle wallets that autoconnect seperately, no need to bounce to
      // connector screen.

      setSolanaConnector(wallet.adapter.name);
      setRoute(ROUTES.SOLANA_CONNECTOR);
    },
  }));

  return (
    <PageContent>
      <OrderHeader minified />

      {wallets.wallets.length === 0 && (
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
          <Button onClick={() => setRoute(ROUTES.SELECT_METHOD)}>
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
