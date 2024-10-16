import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import {
  PageContent
} from "../../Common/Modal/styles";

import {
  capitalize,
  DaimoPayToken,
  getDisplayPrice
} from "@daimo/common";
import {
  getChainName
} from "@daimo/contract";
import { motion } from "framer-motion";
import {
  useAccount
} from "wagmi";
import {
  chainToLogo
} from "../../../assets/chains";
import styled from "../../../styles/styled";
import { PaymentOption } from "../../../utils/getPaymentInfo";
import { trpc } from "../../../utils/trpc";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";

function getDaimoTokenKey(token: DaimoPayToken) {
  return `${token.chainId}-${token.token}`;
}

const TokenChainLogo = ({ token }: { token: DaimoPayToken }) => {
  return (
    <TokenChainContainer>
      <img
        src={token.logoURI}
        alt={token.symbol}
        style={{ borderRadius: 9999 }}
      />
      <ChainContainer>{chainToLogo[token.chainId]}</ChainContainer>
    </TokenChainContainer>
  );
};

const TokenChainContainer = styled(motion.div)`
  width: 100%;
  height: 100%;
`;

const ChainContainer = styled(motion.div)`
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  overflow: hidden;
  bottom: 0px;
  right: 0px;
`;

const SelectToken: React.FC = () => {
  const { setRoute, paymentInfo } = useContext();
  const { daimoPayOrder, setSelectedTokenOption } = paymentInfo;
  const { address: payerAddress } = useAccount();

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[] | null>(
    null,
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    if (!payerAddress || !daimoPayOrder) return;
    setIsLoadingOptions(true);

    const destChainId = daimoPayOrder!.destFinalCallTokenAmount.token.chainId;
    trpc.getWalletPaymentOptions
      .query({
        payerAddress,
        usdRequired: daimoPayOrder!.destFinalCallTokenAmount.usd,
        destChainId,
      })
      .then(setPaymentOptions)
      .finally(() => setIsLoadingOptions(false));
  }, [payerAddress, daimoPayOrder]);

  return (
    <PageContent>
      <OrderHeader minified />

      <OptionsList
        requiredSkeletons={4}
        isLoading={isLoadingOptions}
        options={
          paymentOptions?.map((option) => {
            const capitalizedChainName = capitalize(
              getChainName(option.required.token.chainId),
            );
            const title = `${getDisplayPrice(option.required)} ${option.required.token.symbol} on ${capitalizedChainName}`;
            const subtitle = `Balance: ${getDisplayPrice(option.balance)} ${option.balance.token.symbol}`;

            return {
              id: getDaimoTokenKey(option.required.token),
              title,
              subtitle,
              icons: [
                <TokenChainLogo
                  key={getDaimoTokenKey(option.required.token)}
                  token={option.required.token}
                />,
              ],
              onClick: () => {
                setSelectedTokenOption(option);
                setRoute(ROUTES.PAY_WITH_TOKEN);
              },
            };
          }) ?? []
        }
      />
    </PageContent>
  );
};

export default SelectToken;
