import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import {
  WalletSendTransactionError,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";
import {
  ModalContent,
  ModalH1,
  PageContent,
} from "../../../Common/Modal/styles";

import { assert } from "@daimo/pay-common";
import Button from "../../../Common/Button";
import PaymentBreakdown from "../../../Common/PaymentBreakdown";
import TokenLogoSpinner from "../../../Spinners/TokenLogoSpinner";

enum PayState {
  RequestingPayment = "Requesting Payment",
  RequestCancelled = "Payment Cancelled",
  RequestFailed = "Payment Failed",
  RequestSuccessful = "Payment Successful",
}

const PayWithSolanaToken: React.FC = () => {
  const { triggerResize, paymentState, setRoute } = usePayContext();
  const {
    payParams,
    generatePreviewOrder,
    selectedSolanaTokenOption,
    payWithSolanaToken,
  } = paymentState;
  const [payState, setPayState] = useState<PayState>(
    PayState.RequestingPayment,
  );

  const handleTransfer = async () => {
    try {
      setPayState(PayState.RequestingPayment);
      assert(
        !!selectedSolanaTokenOption,
        "[PAY SOLANA] No token option selected",
      );
      await payWithSolanaToken(selectedSolanaTokenOption.required.token.token);

      setPayState(PayState.RequestSuccessful);
      setTimeout(() => {
        setRoute(ROUTES.CONFIRMATION, { event: "wait-pay-with-solana" });
      }, 200);
    } catch (error) {
      console.error(error);
      if (
        error instanceof WalletSignTransactionError ||
        error instanceof WalletSendTransactionError
      ) {
        setPayState(PayState.RequestCancelled);
      } else {
        setPayState(PayState.RequestFailed);
      }
    }
  };

  let transferTimeout: any; // Prevent double-triggering in React dev strict mode.
  useEffect(() => {
    if (!selectedSolanaTokenOption) return;

    // Give user time to see the UI before opening
    transferTimeout = setTimeout(handleTransfer, 100);
    return () => clearTimeout(transferTimeout);
  }, []);

  useEffect(() => {
    triggerResize();
  }, [payState]);

  return (
    <PageContent>
      {selectedSolanaTokenOption && (
        <TokenLogoSpinner token={selectedSolanaTokenOption.required.token} />
      )}
      <ModalContent style={{ paddingBottom: 0 }}>
        <ModalH1>{payState}</ModalH1>
        {selectedSolanaTokenOption && (
          <PaymentBreakdown paymentOption={selectedSolanaTokenOption} />
        )}
        {payState === PayState.RequestCancelled && (
          <Button onClick={handleTransfer}>Retry Payment</Button>
        )}
        {payState === PayState.RequestFailed && (
          <Button
            onClick={() => {
              assert(
                payParams != null,
                "[PAY SOLANA] payParams cannot be null in deposit flow",
              );
              generatePreviewOrder(payParams);
              setRoute(ROUTES.SELECT_METHOD, { event: "click-select-another" });
            }}
          >
            Select Another Method
          </Button>
        )}
      </ModalContent>
    </PageContent>
  );
};

export default PayWithSolanaToken;
