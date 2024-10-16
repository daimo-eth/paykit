import React, { useCallback, useEffect, useState } from "react";
import { useContext, ROUTES } from "../../ConnectKit";

import {
  LearnMoreContainer,
  LearnMoreButton,
  InfoBox,
  InfoBoxButtons,
} from "./styles";
import {
  PageContent,
  Disclaimer,
  ModalContent,
  ModalH1,
  ModalBody,
} from "../../Common/Modal/styles";
import WalletIcon from "../../../assets/wallet";

import useLocales from "../../../hooks/useLocales";
import ConnectorList from "../../Common/ConnectorList";
import useIsMobile from "../../../hooks/useIsMobile";
import Button from "../../Common/Button";
import FitText from "../../Common/FitText";
import { OrderHeader } from "../../Common/OrderHeader";
import OptionsList from "../../Common/OptionsList";
import {
  Coinbase,
  MetaMask,
  Rainbow,
  WalletConnect,
} from "../../../assets/logos";
import { detectPlatform } from "../../../utils/platform";
import { trpc } from "../../../utils/trpc";
import {
  ExternalPaymentOptionMetadata,
  getAddressContraction,
} from "@daimo/common";
import { useAccount, useEnsName } from "wagmi";
import { ethereum } from "@daimo/contract";

const SelectMethod: React.FC = () => {
  const { address, isConnected, connector } = useAccount();
  const { data: ensName } = useEnsName({
    chainId: ethereum.chainId,
    address: address,
  });

  const displayName =
    ensName ?? (address ? getAddressContraction(address) : "wallet");

  const { setRoute, paymentInfo } = useContext();
  const { daimoPayOrder, setSelectedExternalOption } = paymentInfo;

  const onWalletClick = useCallback(() => {
    if (isConnected) setRoute(ROUTES.SELECT_TOKEN);
    else setRoute(ROUTES.CONNECTORS);
  }, [isConnected]);

  const walletOption = {
    id: "wallet",
    title: `Pay with ${displayName}`,
    icons:
      connector && connector.icon
        ? [connector.icon]
        : [<MetaMask />, <Rainbow />, <Coinbase />],
    onClick: onWalletClick,
  };

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

      setExternalPaymentOptions(options);
      setLoadingExternalPaymentOptions(false);
    };

    const usd = daimoPayOrder?.destFinalCallTokenAmount.usd;
    if (usd) {
      refreshExternalPaymentOptions(usd);
    }
  }, [daimoPayOrder?.destFinalCallTokenAmount.usd]);

  return (
    <PageContent>
      <OrderHeader />

      <OptionsList
        requiredSkeletons={4}
        isLoading={loadingExternalPaymentOptions}
        options={[
          walletOption,
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
    </PageContent>
  );
};

export default SelectMethod;
