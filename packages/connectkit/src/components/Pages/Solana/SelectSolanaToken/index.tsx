import React from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { getDisplayPrice } from "@daimo/common";
import Button from "../../../Common/Button";
import OptionsList from "../../../Common/OptionsList";
import { OrderHeader } from "../../../Common/OrderHeader";

const SelectSolanaToken: React.FC = () => {
  const { paymentState, setRoute } = usePayContext();
  const { solanaPaymentOptions, setSelectedSolanaTokenOption } = paymentState;

  return (
    <PageContent>
      <OrderHeader minified />

      {!solanaPaymentOptions.isLoading &&
        solanaPaymentOptions.options?.length === 0 && (
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
        options={
          solanaPaymentOptions.options?.map((option) => {
            const title = `${getDisplayPrice(option.required)} ${option.required.token.symbol}`;
            const subtitle = `Balance: ${getDisplayPrice(option.balance)} ${option.balance.token.symbol}`;

            return {
              id: `${option.required.token.token}-${option.required.token.symbol}`,
              title,
              subtitle,
              icons: [
                <img
                  src={option.required.token.logoURI}
                  alt={option.required.token.symbol}
                  style={{ borderRadius: 9999 }}
                />,
              ],
              onClick: () => {
                setSelectedSolanaTokenOption(option);
                setRoute(ROUTES.SOLANA_PAY_WITH_TOKEN);
              },
            };
          }) ?? []
        }
      />
    </PageContent>
  );
};

export default SelectSolanaToken;
