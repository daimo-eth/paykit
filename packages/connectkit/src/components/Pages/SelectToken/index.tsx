import React from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { capitalize, DaimoPayToken, getDisplayPrice } from "@daimo/common";
import { getChainName } from "@daimo/contract";
import { motion } from "framer-motion";
import { chainToLogo } from "../../../assets/chains";
import styled from "../../../styles/styled";
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
  const { setSelectedTokenOption, walletPaymentOptions } = paymentInfo;

  return (
    <PageContent>
      <OrderHeader minified />

      {!walletPaymentOptions.isLoading &&
        walletPaymentOptions.options?.length === 0 && (
          <ModalContent
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <ModalH1>Insufficient balance.</ModalH1>
            <Button onClick={() => setRoute(ROUTES.SELECT_METHOD)}>
              Select Another Method
            </Button>
          </ModalContent>
        )}

      <OptionsList
        requiredSkeletons={4}
        isLoading={walletPaymentOptions.isLoading}
        options={
          walletPaymentOptions.options?.map((option) => {
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
