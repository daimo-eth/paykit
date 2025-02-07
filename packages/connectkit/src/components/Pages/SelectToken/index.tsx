import React from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { capitalize, DaimoPayToken } from "@daimo/common";
import { getChainName } from "@daimo/contract";
import { formatUsd, roundTokenAmount } from "../../../utils/format";
import Button from "../../Common/Button";
import OptionsList from "../../Common/OptionsList";
import { OrderHeader } from "../../Common/OrderHeader";
import TokenChainLogo from "../../Common/TokenChainLogo";

function getDaimoTokenKey(token: DaimoPayToken) {
  return `${token.chainId}-${token.token}`;
}

const SelectToken: React.FC = () => {
  const { setRoute, paymentState } = usePayContext();
  const { isDepositFlow, walletPaymentOptions, setSelectedTokenOption } =
    paymentState;

  const optionsList =
    walletPaymentOptions.options?.map((option) => {
      const capitalizedChainName = capitalize(
        getChainName(option.balance.token.chainId),
      );
      const titlePrice = isDepositFlow
        ? formatUsd(option.balance.usd)
        : roundTokenAmount(option.required.amount, option.required.token);
      const title = `${titlePrice} ${option.balance.token.symbol} on ${capitalizedChainName}`;
      const subtitle = `${isDepositFlow ? "" : "Balance: "}${roundTokenAmount(option.balance.amount, option.balance.token)} ${option.balance.token.symbol}`;

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
          setSelectedTokenOption(option);
          if (isDepositFlow) {
            setRoute(ROUTES.SELECT_AMOUNT);
          } else {
            setRoute(ROUTES.PAY_WITH_TOKEN);
          }
        },
      };
    }) ?? [];

  return (
    <PageContent>
      <OrderHeader minified />

      {!walletPaymentOptions.isLoading && optionsList.length === 0 && (
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
        options={optionsList}
      />
    </PageContent>
  );
};

export default SelectToken;
