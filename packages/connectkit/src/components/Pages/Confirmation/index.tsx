import React, { useEffect } from "react";
import { useContext } from "../../DaimoPay";

import { ModalContent, PageContent } from "../../Common/Modal/styles";

import { capitalize, DaimoPayOrder, DaimoPayOrderMode } from "@daimo/common";
import { getChainExplorerTxUrl, getChainName } from "@daimo/contract";
import { motion } from "framer-motion";
import { css } from "styled-components";
import { LoadingCircleIcon, TickIcon } from "../../../assets/icons";
import styled from "../../../styles/styled";
import Button from "../../Common/Button";

function getPathMetadata(order: DaimoPayOrder | null): {
  path: { label: string; url?: string }[];
  currentStep: number;
} {
  if (!order || order.mode !== DaimoPayOrderMode.HYDRATED) {
    return {
      path: [],
      currentStep: 0,
    };
  }

  const path: { label: string; url?: string }[] = [];
  // Source token
  const sourceChainName = order.sourceTokenAmount
    ? capitalize(getChainName(order.sourceTokenAmount.token.chainId))
    : "Unknown";
  const sourceTokenSymbol = order.sourceTokenAmount
    ? order.sourceTokenAmount.token.symbol
    : "Unknown";
  if (order.sourceTokenAmount) {
    path.push({
      label: `Paid in ${sourceChainName} ${sourceTokenSymbol}`,
      url: getChainExplorerTxUrl(
        order.sourceTokenAmount.token.chainId,
        order.sourceInitiateTxHash!,
      ),
    });
  } else path.push({ label: `Payment started` });

  // (TODO) Bridge source token in future -- this can vary by bridging mechanism so easiest to not display for now

  // Mint token
  const destChainName = capitalize(
    getChainName(order.destMintTokenAmount.token.chainId),
  );
  const destMintTokenSymbol = order.destMintTokenAmount.token.symbol;
  const finalTokenSymbol = order.destFinalCallTokenAmount.token.symbol;
  if (
    (sourceChainName !== destChainName || // source differs
      sourceTokenSymbol !== destMintTokenSymbol) &&
    destMintTokenSymbol !== finalTokenSymbol // final destination differs
  ) {
    path.push({
      label: `Bridged to ${destChainName} ${destMintTokenSymbol}`,
      url: order.destFastFinishTxHash
        ? getChainExplorerTxUrl(
            order.destMintTokenAmount.token.chainId,
            order.destFastFinishTxHash,
          )
        : undefined,
    });
  }

  // Final token
  path.push({
    label: `Completed in ${destChainName} ${finalTokenSymbol}`,
    url: order.destFastFinishTxHash
      ? getChainExplorerTxUrl(
          order.destFinalCallTokenAmount.token.chainId,
          order.destFastFinishTxHash,
        )
      : undefined,
  });

  const currentStep = (() => {
    if (order.destClaimTxHash || order.destFastFinishTxHash) {
      return path.length;
    } else if (order.sourceInitiateTxHash) {
      return 1;
    }
    return 0;
  })();
  return { path, currentStep };
}

const StepDisplay = ({
  label,
  url,
  status,
  last,
}: {
  label: string;
  url?: string;
  status: "pending" | "success";
  last: boolean;
}) => {
  return (
    <StepContainer $last={last}>
      <IconAndLineContainer>
        {status === "success" ? <SuccessIcon /> : <Spinner />}
        {!last && <Line $status={status} />}
      </IconAndLineContainer>
      <LabelContainer $status={status}>
        {url ? (
          <Link href={url} target="_blank" rel="noopener noreferrer">
            {label}
          </Link>
        ) : (
          label
        )}
      </LabelContainer>
    </StepContainer>
  );
};

const Link = styled.a`
  color: var(--ck-body-color);
  text-decoration: none;

  &:hover {
    color: var(--ck-body-color-muted);
  }
`;

const SuccessIcon = styled(TickIcon)`
  color: var(--ck-body-color-valid);
  transition: transform 0.2s ease-in-out;
  width: 32px;
  height: 32px;
`;

const Spinner = styled(LoadingCircleIcon)`
  color: var(--ck-body-color-valid-muted);
  transition: transform 0.2s ease-in-out;
  animation: rotateSpinner 1200ms linear infinite;
  width: 32px;
  height: 32px;

  @keyframes rotateSpinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StepContainer = styled(motion.div)<{ $last: boolean }>`
  display: flex;
  margin-bottom: 32px;
  width: 100%;
`;

const LabelContainer = styled(motion.div)<{ $status: "pending" | "success" }>`
  margin-left: 16px;
  margin-right: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$status === "pending"
      ? css`
          color: var(--ck-body-color);
        `
      : css`
          color: var(--ck-body-color-valid);
        `}
`;

const IconAndLineContainer = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
`;

const Line = styled.div<{ $status: "pending" | "success" }>`
  position: absolute;
  top: 32px;
  width: 4px;
  height: 40px;
  background-color: var(--ck-body-color-valid-muted);
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--ck-body-color-valid);
    transform: ${(props) =>
      props.$status === "success" ? "scaleY(1)" : "scaleY(0)"};
    transform-origin: top;
    transition: transform 0.5s ease-in-out;
  }
`;

const Confirmation: React.FC = () => {
  const { paymentInfo, setOpen, triggerResize } = useContext();
  const { daimoPayOrder, refreshOrder } = paymentInfo;

  const { path, currentStep } = getPathMetadata(daimoPayOrder);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrder();
    }, 300);
    return () => clearInterval(interval);
  }, [refreshOrder]);

  useEffect(() => {
    if (
      daimoPayOrder?.mode === DaimoPayOrderMode.HYDRATED &&
      daimoPayOrder.destFastFinishTxHash
    ) {
      triggerResize();
    }
  }, [currentStep, daimoPayOrder]);

  const done =
    daimoPayOrder?.mode === DaimoPayOrderMode.HYDRATED &&
    daimoPayOrder.destFastFinishTxHash;

  return (
    <PageContent style={{ display: "flex", justifyContent: "center" }}>
      <ModalContent style={{ alignItems: "center", paddingBottom: 0, gap: 0 }}>
        {path.map((step, index) => (
          <StepDisplay
            key={index}
            label={step.label}
            url={step.url}
            status={index < currentStep ? "success" : "pending"}
            last={index === path.length - 1}
          />
        ))}
        {done && <Button onClick={() => setOpen(false)}>Continue</Button>}
      </ModalContent>
    </PageContent>
  );
};

export default Confirmation;
