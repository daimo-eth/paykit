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

// TODO: min amount for deposit address should come from the backend
const MIN_USD_VALUE = 20;
// TODO: make max amount a shared constant
const MAX_USD_VALUE = 20000;

const SelectDepositAddressAmount: React.FC = () => {
  const { paymentState, setRoute, triggerResize } = usePayContext();
  const { selectedDepositAddressOption } = paymentState;

  const minimumMessage = `Minimum ${formatUsd(MIN_USD_VALUE, "up")}`;

  const [usdInput, setUsdInput] = useState<string>("");
  const [message, setMessage] = useState<string | null>(minimumMessage);
  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    triggerResize();
  }, [message]);

  if (selectedDepositAddressOption == null) {
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
        Number(value) < MIN_USD_VALUE ||
        Number(value) > MAX_USD_VALUE,
    );
  };

  const handleContinue = () => {
    paymentState.setChosenUsd(Number(usdInput));
    setRoute(ROUTES.WAITING_DEPOSIT_ADDRESS);
  };

  return (
    <PageContent>
      <LoadingContainer>
        <AnimationContainer $circle={true}>
          <AnimatePresence>
            <CircleSpinner
              logo={<img src={selectedDepositAddressOption.logoURI} />}
              loading={true}
              unavailable={false}
            />
          </AnimatePresence>
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

export default SelectDepositAddressAmount;
