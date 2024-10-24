import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { capitalize, DaimoPayToken, getDisplayPrice } from "@daimo/common";
import { getChainName } from "@daimo/contract";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { chainToLogo } from "../../../assets/chains";
import styled from "../../../styles/styled";
import { PaymentOption } from "../../../utils/getPaymentInfo";
import { trpc } from "../../../utils/trpc";
import Button from "../../Common/Button";
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

      {!isLoadingOptions && paymentOptions?.length === 0 && (
        <ModalContent
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <ModalH1>
            Insufficient balance. Please select an alternative payment method.
          </ModalH1>
          <Button onClick={() => setRoute(ROUTES.SELECT_METHOD)}>
            Select Another Method
          </Button>
        </ModalContent>
      )}

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
