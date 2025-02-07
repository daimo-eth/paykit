import React from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { DaimoPayToken } from "@daimo/common";
import { formatUsd, roundTokenAmount } from "../../../../utils/format";
import Button from "../../../Common/Button";
import OptionsList from "../../../Common/OptionsList";
import { OrderHeader } from "../../../Common/OrderHeader";
import TokenChainLogo from "../../../Common/TokenChainLogo";

function getDaimoSolanaTokenKey(token: DaimoPayToken) {
  return `${token.chainId}-${token.token}`;
}

const SelectSolanaToken: React.FC = () => {
  const { paymentState, setRoute } = usePayContext();
  const { isDepositFlow, solanaPaymentOptions, setSelectedSolanaTokenOption } =
    paymentState;

  const optionsList =
    solanaPaymentOptions.options?.map((option) => {
      const titlePrice = isDepositFlow
        ? formatUsd(option.balance.usd)
        : roundTokenAmount(option.required.amount, option.required.token);
      const title = `${titlePrice} ${option.balance.token.symbol} on Solana`;
      const subtitle = `${isDepositFlow ? "" : "Balance: "}${roundTokenAmount(option.balance.amount, option.balance.token)} ${option.balance.token.symbol}`;

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
          setSelectedSolanaTokenOption(option);
          if (isDepositFlow) {
            setRoute(ROUTES.SOLANA_SELECT_AMOUNT);
          } else {
            setRoute(ROUTES.SOLANA_PAY_WITH_TOKEN);
          }
        },
      };
    }) ?? [];

  return (
    <PageContent>
      <OrderHeader minified />

      {!solanaPaymentOptions.isLoading && optionsList.length === 0 && (
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
        isLoading={solanaPaymentOptions.isLoading}
        options={optionsList}
      />
    </PageContent>
  );
};

export default SelectSolanaToken;
