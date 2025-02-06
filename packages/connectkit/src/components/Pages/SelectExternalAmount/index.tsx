import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  PageContent,
} from "../../Common/Modal/styles";

import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import styled from "../../../styles/styled";
import { formatUsd, USD_DECIMALS } from "../../../utils/format";
import { isValidNumber } from "../../../utils/validateInput";
import AmountInput from "../../Common/AmountInput";
import Button from "../../Common/Button";
import CircleSpinner from "../../Spinners/CircleSpinner";
import SquircleSpinner from "../../Spinners/SquircleSpinner";

const MAX_USD_VALUE = 20000;

const SelectExternalAmount: React.FC = () => {
  const { paymentState, setRoute, triggerResize } = usePayContext();
  const { selectedExternalOption } = paymentState;

  const minimumMessage = `Minimum ${formatUsd(selectedExternalOption?.minimumUsd ?? 0, "up")}`;

  const [usdInput, setUsdInput] = useState<string>("");
  const [message, setMessage] = useState<string | null>(minimumMessage);
  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    triggerResize();
  }, [message]);

  if (selectedExternalOption == null) {
    return <PageContent></PageContent>;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== "" && !isValidNumber(value, USD_DECIMALS)) return;

    setUsdInput(value);

    if (Number(value) > MAX_USD_VALUE) {
      setMessage(`Maximum ${formatUsd(MAX_USD_VALUE, "up")}`);
    } else {
      setMessage(minimumMessage);
    }

    setContinueDisabled(
      value === "" ||
        Number(value) <= 0 ||
        Number(value) < (selectedExternalOption.minimumUsd ?? 0) ||
        Number(value) > MAX_USD_VALUE,
    );
  };

  const handleContinue = () => {
    paymentState.setChosenUsd(Number(usdInput));
    setRoute(ROUTES.WAITING_OTHER);
  };

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
      <ModalContent>
        <AmountInputContainer>
          <AmountInput value={usdInput} onChange={handleAmountChange} />
        </AmountInputContainer>
        {message && <ModalBody>{message}</ModalBody>}
        <Button onClick={handleContinue} disabled={continueDisabled}>
          Continue
        </Button>
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

const AmountInputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default SelectExternalAmount;
