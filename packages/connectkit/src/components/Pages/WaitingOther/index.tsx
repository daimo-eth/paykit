import React, { useEffect } from "react";
import { useContext, ROUTES } from "../../ConnectKit";

import {
  LearnMoreContainer,
  LearnMoreButton,
  InfoBox,
  InfoBoxButtons,
} from "./styles";
import {
  PageContent,
  Disclaimer,
  ModalContent,
  ModalH1,
  ModalBody,
} from "../../Common/Modal/styles";
import WalletIcon from "../../../assets/wallet";

import useLocales from "../../../hooks/useLocales";
import ConnectorList from "../../Common/ConnectorList";
import useIsMobile from "../../../hooks/useIsMobile";
import Button from "../../Common/Button";
import styled from "../../../styles/styled";
import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import CircleSpinner from "../../Spinners/CircleSpinner";
import SquircleSpinner from "../../Spinners/SquircleSpinner";
import defaultTheme from "../../../constants/defaultTheme";

const WaitingOther: React.FC = () => {
  const { triggerResize, paymentInfo } = useContext();
  const { selectedExternalOption, payWithExternal, paymentWaitingMessage } =
    paymentInfo;

  if (!selectedExternalOption) {
    return <PageContent></PageContent>;
  }

  const optionSpinner = (() => {
    if (selectedExternalOption.logoShape === "circle") {
      return (
        <CircleSpinner
          logo={<img src={selectedExternalOption.logoURI} />}
          connecting={true}
          unavailable={false}
        />
      );
    } else {
      return (
        <SquircleSpinner
          logo={<img src={selectedExternalOption.logoURI} />}
          connecting={true}
        />
      );
    }
  })();

  useEffect(() => {
    if (!selectedExternalOption) return;

    // Note: Safari doesn't support window.open in an async function.
    // We need to trigger this in the main thread:
    // https://stackoverflow.com/a/39387533
    const windowOpen = window.open("about:blank", "_blank");
    payWithExternal(selectedExternalOption.id).then((url) => {
      if (windowOpen) windowOpen.location.href = url;
    });
  }, [selectedExternalOption]);

  const waitingMessageLength = paymentWaitingMessage?.length;
  useEffect(() => {
    triggerResize();
  }, [waitingMessageLength]);

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
          <ModalBody style={{ marginTop: 12 }}>
            {paymentWaitingMessage}
          </ModalBody>
        )}
      </ModalContent>
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
