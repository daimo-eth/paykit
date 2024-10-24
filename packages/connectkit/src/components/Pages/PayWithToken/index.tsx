import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import { useChainId, useSwitchChain } from "wagmi";
import { chainToLogo } from "../../../assets/chains";
import styled from "../../../styles/styled";
import { PaymentOption } from "../../../utils/getPaymentInfo";
import Button from "../../Common/Button";
import CircleSpinner from "../../Spinners/CircleSpinner";

enum PayState {
  RequestingPayment = "Requesting Payment",
  SwitchingChain = "Switching Chain",
  RequestCancelled = "Payment Cancelled",
  RequestSuccessful = "Payment Successful",
}

const PayWithToken: React.FC = () => {
  const { triggerResize, paymentInfo, setRoute, log } = useContext();
  const { selectedTokenOption, payWithToken } = paymentInfo;
  const [payState, setPayState] = useState<PayState>(
    PayState.RequestingPayment,
  );

  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const trySwitchingChain = async (
    option: PaymentOption,
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

  const handleTransfer = async (option: PaymentOption) => {
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
              connecting={true}
              unavailable={false}
            />
          </AnimatePresence>
        </AnimationContainer>
      </LoadingContainer>
      <ModalContent style={{ paddingBottom: 0 }}>
        <ModalH1>{payState}</ModalH1>
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

export default PayWithToken;
