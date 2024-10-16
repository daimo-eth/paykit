import React, { useCallback, useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import {
  PageContent
} from "../../Common/Modal/styles";

import {
  ExternalPaymentOptionMetadata,
  getAddressContraction,
} from "@daimo/common";
import { ethereum } from "@daimo/contract";
import { useAccount, useEnsName } from "wagmi";
import {
  Coinbase,
  MetaMask,
  Rainbow
} from "../../../assets/logos";
import { detectPlatform } from "../../../utils/platform";
import { trpc } from "../../../utils/trpc";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";

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
