import React from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { DaimoPayToken, getDisplayPrice } from "@daimo/common";
import { formatUsd } from "../../../../utils/format";
import Button from "../../../Common/Button";
import OptionsList from "../../../Common/OptionsList";
import { OrderHeader } from "../../../Common/OrderHeader";
import TokenChainLogo from "../../../Common/TokenChainLogo";

function getDaimoSolanaTokenKey(token: DaimoPayToken) {
  return `${token.chainId}-${token.token}`;
}

const SelectSolanaToken: React.FC = () => {
  const { paymentState, setRoute } = usePayContext();
  const {
    isDepositFlow,
    solanaPaymentOptions,
    solanaBalanceOptions,
    setSelectedSolanaTokenOption,
    setSelectedSolanaTokenBalance,
  } = paymentState;

  const isLoading = isDepositFlow
    ? solanaBalanceOptions.isLoading
    : solanaPaymentOptions.isLoading;

  const optionsList = isDepositFlow
    ? (solanaBalanceOptions.options?.map((option) => {
        const balanceUsd = formatUsd(option.balance.usd, "down");
        const title = `${balanceUsd} ${option.balance.token.symbol} on Solana`;
        const subtitle = `${getDisplayPrice(option.balance)} ${option.balance.token.symbol}`;

        return {
          id: getDaimoSolanaTokenKey(option.balance.token),
          title,
          subtitle,
          icons: [
            <TokenChainLogo
              key={getDaimoSolanaTokenKey(option.balance.token)}
              token={option.balance.token}
            />,
          ],
          onClick: () => {
            setSelectedSolanaTokenBalance(option);
            setRoute(ROUTES.SOLANA_SELECT_AMOUNT);
          },
        };
      }) ?? [])
    : (solanaPaymentOptions.options?.map((option) => {
        const title = `${getDisplayPrice(option.required)} ${option.required.token.symbol} on Solana`;
        const subtitle = `Balance: ${getDisplayPrice(option.balance)} ${option.balance.token.symbol}`;

        return {
          id: getDaimoSolanaTokenKey(option.required.token),
          title,
          subtitle,
          icons: [
            <TokenChainLogo
              key={getDaimoSolanaTokenKey(option.balance.token)}
              token={option.balance.token}
            />,
          ],
          onClick: () => {
            setSelectedSolanaTokenOption(option);
            setRoute(ROUTES.SOLANA_PAY_WITH_TOKEN);
          },
        };
      }) ?? []);

  return (
    <PageContent>
      <OrderHeader minified />

      {!isLoading && optionsList.length === 0 && (
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
        isLoading={isLoading}
        options={optionsList}
      />
    </PageContent>
  );
};

export default SelectSolanaToken;
