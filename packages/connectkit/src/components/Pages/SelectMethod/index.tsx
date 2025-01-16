import React from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import { PageContent } from "../../Common/Modal/styles";

import {
  DepositAddressPaymentOptionMetadata,
  getAddressContraction,
} from "@daimo/common";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connector, useAccount, useDisconnect } from "wagmi";
import { Bitcoin, Solana, Tron, Zcash } from "../../../assets/chains";
import { Coinbase, MetaMask, Rabby, Rainbow } from "../../../assets/logos";
import useIsMobile from "../../../hooks/useIsMobile";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";
import PoweredByFooter from "../../Common/PoweredByFooter";

// Get 3 icons, skipping the one that is already connected
function getBestUnconnectedWalletIcons(connector: Connector | undefined) {
  const icons: JSX.Element[] = [];
  const strippedId = connector?.id.toLowerCase(); // some connector ids can have weird casing and or suffixes and prefixes
  const [isMetaMask, isRainbow, isCoinbase] = [
    strippedId?.includes("metamask"),
    strippedId?.includes("rainbow"),
    strippedId?.includes("coinbase"),
  ];

  if (!isMetaMask) icons.push(<MetaMask />);
  if (!isRainbow) icons.push(<Rainbow />);
  if (!isCoinbase) icons.push(<Coinbase />);
  if (icons.length < 3) icons.push(<Rabby />);

  return icons;
}

function getSolanaOption() {
  const { wallets } = useWallet();
  const { setRoute } = usePayContext();

  if (wallets.length === 0) return null;

  return {
    id: "solana",
    title: "Pay on Solana",
    icons: [<Solana />],
    onClick: () => {
      setRoute(ROUTES.SOLANA_CONNECT);
    },
  };
}

function getDepositAddressOption(depositAddressOptions: {
  loading: boolean;
  options: DepositAddressPaymentOptionMetadata[];
}) {
  const { setRoute } = usePayContext();

  if (
    !depositAddressOptions.loading &&
    depositAddressOptions.options.length === 0
  ) {
    return null;
  }

  return {
    id: "depositAddress",
    title: "Pay on another chain",
    subtitle: "Bitcoin, Tron, Zcash...",
    icons: [<Bitcoin />, <Tron />, <Zcash />],
    onClick: () => {
      setRoute(ROUTES.SELECT_DEPOSIT_ADDRESS_CHAIN);
    },
  };
}

const SelectMethod: React.FC = () => {
  const isMobile = useIsMobile();

  const { address, isConnected, connector } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const { setRoute, paymentState, log } = usePayContext();
  const {
    setSelectedExternalOption,
    externalPaymentOptions,
    depositAddressOptions,
    senderEnsName,
  } = paymentState;
  const displayName =
    senderEnsName ?? (address ? getAddressContraction(address) : "wallet");

  const connectedWalletOption = isConnected
    ? {
        id: "connectedWallet",
        title: `Pay with ${displayName}`,
        icons: connector && connector.icon ? [connector.icon] : [<MetaMask />],
        onClick: () => {
          setRoute(ROUTES.SELECT_TOKEN);
        },
      }
    : null;

  const unconnectedWalletOption = {
    id: "unconnectedWallet",
    title: isConnected ? `Pay with another wallet` : `Pay with wallet`,
    icons: getBestUnconnectedWalletIcons(connector),
    onClick: async () => {
      await disconnectAsync();
      setRoute(ROUTES.CONNECTORS);
    },
  };

  const walletOptions = connectedWalletOption
    ? [connectedWalletOption, unconnectedWalletOption]
    : [unconnectedWalletOption];

  log(
    `[SELECT_METHOD] loading: ${externalPaymentOptions.loading}, options: ${JSON.stringify(
      externalPaymentOptions.options,
    )}`,
  );

  const solanaOption = getSolanaOption();
  const depositAddressOption = getDepositAddressOption(depositAddressOptions);

  const options = [
    ...walletOptions,
    ...(solanaOption ? [solanaOption] : []),
    ...(externalPaymentOptions.options ?? []).map((option) => ({
      id: option.id,
      title: option.cta,
      icons: [option.logoURI],
      onClick: () => {
        setSelectedExternalOption(option);
        setRoute(ROUTES.WAITING_OTHER);
      },
      disabled: option.disabled,
      subtitle: option.message,
    })),
    ...(depositAddressOption ? [depositAddressOption] : []),
  ];

  return (
    <PageContent>
      <OrderHeader />

      <OptionsList
        requiredSkeletons={isMobile ? 4 : 3} // TODO: programmatically determine skeletons to best avoid layout shifts
        isLoading={externalPaymentOptions.loading}
        options={externalPaymentOptions.loading ? [] : options}
      />
      <PoweredByFooter />
    </PageContent>
  );
};

export default SelectMethod;
