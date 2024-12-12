import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  ModalH1,
  PageContent,
} from "../../Common/Modal/styles";

import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import { ExternalLinkIcon } from "../../../assets/icons";
import styled from "../../../styles/styled";
import Button from "../../Common/Button";
import CircleSpinner from "../../Spinners/CircleSpinner";
import SquircleSpinner from "../../Spinners/SquircleSpinner";

const WaitingOther: React.FC = () => {
  const { trpc, triggerResize, paymentInfo, setRoute } = usePayContext();
  const {
    selectedExternalOption,
    payWithExternal,
    paymentWaitingMessage,
    daimoPayOrder,
  } = paymentInfo;

  const [externalURL, setExternalURL] = useState<string | null>(null);

  useEffect(() => {
    const checkForSourcePayment = async () => {
      if (!daimoPayOrder) return;

      const found = await trpc.findSourcePayment.query({
        orderId: daimoPayOrder.id.toString(),
      });

      if (found) {
        setRoute(ROUTES.CONFIRMATION);
      }
    };

    const interval = setInterval(checkForSourcePayment, 1000);
    return () => clearInterval(interval);
  }, [daimoPayOrder?.id]);

  useEffect(() => {
    if (!selectedExternalOption) return;

    payWithExternal(selectedExternalOption.id).then((url) => {
      setExternalURL(url);
      setTimeout(() => {
        window.open(url, "_blank");
      });
    });
  }, [selectedExternalOption]);

  const waitingMessageLength = paymentWaitingMessage?.length;
  useEffect(() => {
    triggerResize();
  }, [waitingMessageLength, externalURL]);

  if (!selectedExternalOption) {
    return <PageContent></PageContent>;
  }

  const optionSpinner = (() => {
    if (selectedExternalOption.logoShape === "circle") {
      return (
        <CircleSpinner
          logo={<img src={selectedExternalOption.logoURI} />}
          loading={true}
          unavailable={false}
        />
      );
    } else {
      return (
        <SquircleSpinner
          logo={<img src={selectedExternalOption.logoURI} />}
          loading={true}
        />
      );
    }
  })();

  return (
    <PageContent>
      <LoadingContainer>
        <AnimationContainer
          $circle={selectedExternalOption.logoShape === "circle"}
        >
          <AnimatePresence>{optionSpinner}</AnimatePresence>
        </AnimationContainer>
      </LoadingContainer>
      <ModalContent style={{ marginLeft: 24, marginRight: 24 }}>
        <ModalH1>Waiting for Payment</ModalH1>
        {paymentWaitingMessage && (
          <ModalBody style={{ marginTop: 12, marginBottom: 12 }}>
            {paymentWaitingMessage}
          </ModalBody>
        )}
      </ModalContent>
      <Button
        icon={<ExternalLinkIcon />}
        onClick={() => {
          if (externalURL) window.open(externalURL, "_blank");
        }}
      >
        Open in New Tab
      </Button>
    </PageContent>
  );
};

export const LoadingContainer = styled(motion.div)`
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

export default WaitingOther;
