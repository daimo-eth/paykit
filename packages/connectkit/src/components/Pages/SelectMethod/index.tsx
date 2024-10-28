import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import { PageContent } from "../../Common/Modal/styles";

import {
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  getAddressContraction,
} from "@daimo/common";
import { ethereum } from "@daimo/contract";
import { Connector, useAccount, useDisconnect, useEnsName } from "wagmi";
import { Coinbase, MetaMask, Rabby, Rainbow } from "../../../assets/logos";
import useIsMobile from "../../../hooks/useIsMobile";
import { detectPlatform } from "../../../utils/platform";
import { trpc } from "../../../utils/trpc";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";
import PoweredByFooter from "../../Common/PoweredByFooter";

const DEFAULT_EXTERNAL_PAYMENT_OPTIONS = [
  ExternalPaymentOptions.Coinbase,
  ExternalPaymentOptions.Binance,
  ExternalPaymentOptions.Daimo,
  ExternalPaymentOptions.RampNetwork,
];

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

const SelectMethod: React.FC = () => {
  const isMobile = useIsMobile();

  const { address, isConnected, connector } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { data: ensName } = useEnsName({
    chainId: ethereum.chainId,
    address: address,
  });

  const displayName =
    ensName ?? (address ? getAddressContraction(address) : "wallet");

  const { setRoute, paymentInfo } = useContext();
  const { daimoPayOrder, setSelectedExternalOption } = paymentInfo;

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

  const [externalPaymentOptions, setExternalPaymentOptions] = useState<
    ExternalPaymentOptionMetadata[]
  >([]);
  const [loadingExternalPaymentOptions, setLoadingExternalPaymentOptions] =
    useState(true);

  useEffect(() => {
    const refreshExternalPaymentOptions = async (usd: number) => {
      setLoadingExternalPaymentOptions(true);
      const options = await trpc.getExternalPaymentOptions.query({
        usdRequired: usd,
        platform: detectPlatform(window.navigator.userAgent),
      });

      // Filter out options not in options JSON
      const enabledExtPaymentOptions =
        daimoPayOrder?.metadata.payer?.paymentOptions ||
        DEFAULT_EXTERNAL_PAYMENT_OPTIONS;
      const filteredOptions = options.filter((option) =>
        enabledExtPaymentOptions.includes(option.id),
      );

      setExternalPaymentOptions(filteredOptions);
      setLoadingExternalPaymentOptions(false);
    };

    const usd = daimoPayOrder?.destFinalCallTokenAmount.usd;
    if (usd != null) {
      refreshExternalPaymentOptions(usd);
    }
  }, [daimoPayOrder?.destFinalCallTokenAmount.usd]);

  return (
    <PageContent>
      <OrderHeader />

      <OptionsList
        requiredSkeletons={isMobile ? 4 : 3} // TODO: programmatically determine skeletons to best avoid layout shifts
        isLoading={loadingExternalPaymentOptions}
        options={[
          ...walletOptions,
          ...(externalPaymentOptions ?? []).map((option) => ({
            id: option.id,
            title: option.cta,
            icons: [option.logoURI],
            onClick: () => {
              setSelectedExternalOption(option);
              setRoute(ROUTES.WAITING_OTHER);
            },
          })),
        ]}
      />
      <PoweredByFooter />
    </PageContent>
  );
};

export default SelectMethod;
