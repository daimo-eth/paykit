import React from "react";
import { useContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import {
  assert,
  DaimoPayOrderMode,
  DaimoPayOrderStatusDest,
} from "@daimo/common";
import { getChainExplorerTxUrl } from "@daimo/contract";
import { motion } from "framer-motion";
import { LoadingCircleIcon, TickIcon } from "../../../assets/icons";
import styled from "../../../styles/styled";
import PoweredByFooter from "../../Common/PoweredByFooter";

const Confirmation: React.FC = () => {
  const { paymentInfo } = useContext();
  const { daimoPayOrder } = paymentInfo;

  const { done, txURL } = (() => {
    if (daimoPayOrder && daimoPayOrder.mode === DaimoPayOrderMode.HYDRATED) {
      // Frontends are optimistic, assume submits will be successful
      const { destStatus } = daimoPayOrder;
      if (
        destStatus === DaimoPayOrderStatusDest.FAST_FINISH_SUBMITTED ||
        destStatus === DaimoPayOrderStatusDest.FAST_FINISHED ||
        destStatus === DaimoPayOrderStatusDest.CLAIM_SUCCESSFUL
      ) {
        const txHash =
          daimoPayOrder.destFastFinishTxHash ?? daimoPayOrder.destClaimTxHash;
        const chainId = daimoPayOrder.destFinalCallTokenAmount.token.chainId;
        assert(txHash != null, `Dest ${destStatus}, but missing txHash`);
        const txURL = getChainExplorerTxUrl(chainId, txHash);

        paymentInfo.onSuccess({ txHash, txURL });
        return {
          done: true,
          txURL,
        };
      }
    }
    return {
      done: false,
      txURL: undefined,
    };
  })();

  return (
    <PageContent
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ModalContent
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 0,
        }}
      >
        <AnimationContainer>
          <InsetContainer>
            <Spinner $status={done} />
            <SuccessIcon $status={done} />
          </InsetContainer>
        </AnimationContainer>

        {!done ? (
          <ModalH1>Confirming...</ModalH1>
        ) : (
          <ModalH1>
            <Link href={txURL} target="_blank" rel="noopener noreferrer">
              Payment completed
            </Link>
          </ModalH1>
        )}

        <PoweredByFooter />
      </ModalContent>
    </PageContent>
  );
};

const AnimationContainer = styled(motion.div)`
  position: relative;
  width: 100px;
  height: 100px;
  transition: transform 0.5s ease-in-out;
  margin-bottom: 16px;
`;

const InsetContainer = styled(motion.div)`
  position: absolute;
  overflow: hidden;
  inset: 6px;
  border-radius: 50px;
  background: var(--ck-body-background);
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }
`;

const Link = styled.a`
  color: var(--ck-body-color);
  text-decoration: none;

  &:hover {
    color: var(--ck-body-color-muted);
  }
`;

const SuccessIcon = styled(TickIcon)<{ $status: boolean }>`
  color: var(--ck-body-color-valid);

  transform: scale(0.5);
  transition: all 0.2s ease-in-out;
  position: absolute;
  opacity: ${(props) => (props.$status ? 1 : 0)};
  transform: ${(props) => (props.$status ? "scale(1)" : "scale(0.5)")};
`;

const Spinner = styled(LoadingCircleIcon)<{ $status: boolean }>`
  position: absolute;
  transition: all 0.2s ease-in-out;
  animation: rotateSpinner 400ms linear infinite;
  opacity: ${(props) => (props.$status ? 0 : 1)};
  transform: ${(props) => (props.$status ? "scale(0.5)" : "scale(1)")};

  @keyframes rotateSpinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default Confirmation;