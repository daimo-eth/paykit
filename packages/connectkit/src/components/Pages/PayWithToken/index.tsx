import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  ModalH1,
  PageContent,
} from "../../Common/Modal/styles";

import { WalletPaymentOption } from "@daimo/common";
import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import { useChainId, useSwitchChain } from "wagmi";
import { chainToLogo } from "../../../assets/chains";
import defaultTheme from "../../../constants/defaultTheme";
import styled from "../../../styles/styled";
import Button from "../../Common/Button";
import CircleSpinner from "../../Spinners/CircleSpinner";

enum PayState {
  RequestingPayment = "Requesting Payment",
  SwitchingChain = "Switching Chain",
  RequestCancelled = "Payment Cancelled",
  RequestSuccessful = "Payment Successful",
}

const PayWithToken: React.FC = () => {
  const { triggerResize, paymentState, setRoute, log } = usePayContext();
  const { selectedTokenOption, payWithToken } = paymentState;
  const [payState, setPayState] = useState<PayState>(
    PayState.RequestingPayment,
  );

  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const trySwitchingChain = async (
    option: WalletPaymentOption,
    forceSwitch: boolean = false,
  ): Promise<boolean> => {
    if (walletChainId !== option.required.token.chainId || forceSwitch) {
      const resultChain = await (async () => {
        try {
          return await switchChainAsync({
            chainId: option.required.token.chainId,
          });
        } catch (e) {
          console.error("Failed to switch chain", e);
          return null;
        }
      })();

      if (resultChain?.id !== option.required.token.chainId) {
        return false;
      }
    }

    return true;
  };

  const handleTransfer = async (option: WalletPaymentOption) => {
    // Switch chain if necessary
    setPayState(PayState.SwitchingChain);
    const switchChain = await trySwitchingChain(option);

    if (!switchChain) {
      console.error("Switching chain failed");
      setPayState(PayState.RequestCancelled);
      return;
    }

    setPayState(PayState.RequestingPayment);
    try {
      await payWithToken(option.required);
      setPayState(PayState.RequestSuccessful);
      setTimeout(() => {
        setRoute(ROUTES.CONFIRMATION);
      }, 200);
    } catch (e: any) {
      if (e?.name === "ConnectorChainMismatchError") {
        // Workaround for Rainbow wallet bug -- user is able to switch chain without
        // the wallet updating the chain ID for wagmi.
        log("Chain mismatch detected, attempting to switch and retry");
        const switchSuccessful = await trySwitchingChain(option, true);
        if (switchSuccessful) {
          try {
            await payWithToken(option.required);
            return; // Payment successful after switching chain
          } catch (retryError) {
            console.error(
              "Failed to pay with token after switching chain",
              retryError,
            );
            throw retryError;
          }
        }
      }
      setPayState(PayState.RequestCancelled);
      console.error("Failed to pay with token", e);
    }
  };

  let transferTimeout: any; // Prevent double-triggering in React dev strict mode.
  useEffect(() => {
    if (!selectedTokenOption) return;

    // Give user time to see the UI before opening
    transferTimeout = setTimeout(() => {
      handleTransfer(selectedTokenOption);
    }, 100);
    return () => {
      clearTimeout(transferTimeout);
    };
  }, []);

  useEffect(() => {
    triggerResize();
  }, [payState]);

  return (
    <PageContent>
      <LoadingContainer>
        <AnimationContainer $circle={true}>
          <AnimatePresence>
            <ChainLogoContainer key="ChainLogoContainer">
              {selectedTokenOption &&
                chainToLogo[selectedTokenOption.required.token.chainId]}
            </ChainLogoContainer>
            <CircleSpinner
              key="CircleSpinner"
              logo={
                <img
                  src={selectedTokenOption?.required.token.logoURI}
                  alt={selectedTokenOption?.required.token.symbol}
                  key={selectedTokenOption?.required.token.logoURI}
                />
              }
              loading={true}
              unavailable={false}
            />
          </AnimatePresence>
        </AnimationContainer>
      </LoadingContainer>
      <ModalContent style={{ paddingBottom: 0 }}>
        <ModalH1>{payState}</ModalH1>
        {selectedTokenOption && (
          <PaymentDetails selectedTokenOption={selectedTokenOption} />
        )}
        {payState === PayState.RequestCancelled && (
          <Button
            onClick={() =>
              selectedTokenOption ? handleTransfer(selectedTokenOption) : null
            }
          >
            Retry Payment
          </Button>
        )}
      </ModalContent>
    </PageContent>
  );
};

interface PaymentDetailsProps {
  selectedTokenOption: WalletPaymentOption;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  selectedTokenOption,
}) => {
  const totalUsd = selectedTokenOption.required.usd;
  const feesUsd = selectedTokenOption.fees.usd;
  const subtotalUsd = totalUsd - feesUsd;

  return (
    <FeesContainer>
      {feesUsd > 0 && (
        <FeeRow>
          <ModalBody>Subtotal</ModalBody>
          <ModalBody>${subtotalUsd.toFixed(2)}</ModalBody>
        </FeeRow>
      )}
      <FeeRow>
        <ModalBody>Fees</ModalBody>
        {feesUsd === 0 ? (
          <Badge>Free</Badge>
        ) : (
          <ModalBody>${feesUsd.toFixed(2)}</ModalBody>
        )}
      </FeeRow>
      <FeeRow style={{ marginTop: 8 }}>
        <ModalBody style={{ fontWeight: 600 }}>Total</ModalBody>
        <ModalBody style={{ fontWeight: 600 }}>
          ${totalUsd.toFixed(2)}
        </ModalBody>
      </FeeRow>
    </FeesContainer>
  );
};

const LoadingContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto 16px;
  height: 120px;
`;
const AnimationContainer = styled(motion.div)<{
  $circle: boolean;
}>`
  user-select: none;
  position: relative;
  --spinner-error-opacity: 0;
  &:before {
    content: "";
    position: absolute;
    inset: 1px;
    opacity: 0;
    background: var(--ck-body-color-danger);
    ${(props) =>
      props.$circle &&
      css`
        inset: -5px;
        border-radius: 50%;
        background: none;
        box-shadow: inset 0 0 0 3.5px var(--ck-body-color-danger);
      `}
  }
`;
const ChainLogoContainer = styled(motion.div)`
  z-index: 10;
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;

  color: var(--ck-body-background);
  transition: color 200ms ease;

  &:before {
    z-index: 5;
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 200ms ease;
    background: var(--ck-body-color);
  }

  svg {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
  }
`;
const FeesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 4px;
  margin: 16px 0;

  @media only screen and (max-width: ${defaultTheme.mobileWidth}px) {
    & ${ModalBody} {
      margin: 0 !important;
      max-width: 100% !important;
      text-align: left !important;
    }
  }
`;
const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
`;
const Badge = styled.span`
  display: inline-block;
  padding: 3px 8px;
  border-radius: var(--ck-primary-button-border-radius);
  font-size: 14px;
  font-weight: 400;
  background: var(
    --ck-secondary-button-background,
    var(--ck-body-background-secondary)
  );
  color: var(--ck-body-color-muted);
`;

export default PayWithToken;
