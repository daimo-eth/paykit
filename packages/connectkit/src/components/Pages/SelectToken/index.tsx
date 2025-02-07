import React from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { capitalize, DaimoPayToken, getDisplayPrice } from "@daimo/common";
import { getChainName } from "@daimo/contract";
import { formatUsd } from "../../../utils/format";
import Button from "../../Common/Button";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";
import TokenChainLogo from "../../Common/TokenChainLogo";

function getDaimoTokenKey(token: DaimoPayToken) {
  return `${token.chainId}-${token.token}`;
}

const SelectToken: React.FC = () => {
  const { setRoute, paymentState } = usePayContext();
  const {
    isDepositFlow,
    walletPaymentOptions,
    walletBalanceOptions,
    setSelectedTokenOption,
    setSelectedTokenBalance,
  } = paymentState;

  const isLoading = isDepositFlow
    ? walletBalanceOptions.isLoading
    : walletPaymentOptions.isLoading;

  const optionsList = isDepositFlow
    ? (walletBalanceOptions.options?.map((option) => {
        const capitalizedChainName = capitalize(
          getChainName(option.balance.token.chainId),
        );
        const balanceUsd = formatUsd(option.balance.usd, "down");
        const title = `${balanceUsd} ${option.balance.token.symbol} on ${capitalizedChainName}`;
        const subtitle = `${getDisplayPrice(option.balance)} ${option.balance.token.symbol}`;

        return {
          id: getDaimoTokenKey(option.balance.token),
          title,
          subtitle,
          icons: [
            <TokenChainLogo
              key={getDaimoTokenKey(option.balance.token)}
              token={option.balance.token}
            />,
          ],
          onClick: () => {
            setSelectedTokenBalance(option);
            setRoute(ROUTES.SELECT_AMOUNT);
          },
        };
      }) ?? [])
    : (walletPaymentOptions.options?.map((option) => {
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

export default SelectToken;
