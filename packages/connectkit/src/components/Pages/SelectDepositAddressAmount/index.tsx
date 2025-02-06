import React, { useEffect, useRef, useState } from "react";
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
import Button from "../../Common/Button";
import CircleSpinner from "../../Spinners/CircleSpinner";

// TODO: move this to the backend
const MINIMUM_AMOUNT = 20;

const SelectDepositAddressAmount: React.FC = () => {
  const { paymentState, setRoute } = usePayContext();
  const { selectedDepositAddressOption } = paymentState;

  const [amountUsd, setAmountUsd] = useState<string>("");
  const [continueDisabled, setContinueDisabled] = useState(true);

  const message = `Minimum ${formatUsd(MINIMUM_AMOUNT, "up")}`;

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the AmountInput when the page loads so the user can start typing immediately
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Test that the value is digits, followed by an optional decimal, followed
    // by more digits
    if (!(value === "" || /^\d+\.?\d*$/.test(value))) return;

    const [digitsBeforeDecimal, digitsAfterDecimal] = (() => {
      if (value.includes(".")) return value.split(".");
      else return [value, ""];
    })();

    if (
      digitsBeforeDecimal.length > 5 ||
      digitsAfterDecimal.length > USD_DECIMALS
    ) {
      return;
    }

    setAmountUsd(value);

    setContinueDisabled(
      value === "" || Number(value) <= 0 || Number(value) < MINIMUM_AMOUNT,
    );
  };

  const handleContinue = () => {
    paymentState.setChosenUsd(Number(amountUsd));
    setRoute(ROUTES.WAITING_DEPOSIT_ADDRESS);
  };

  if (!selectedDepositAddressOption) {
    return <PageContent></PageContent>;
  }

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
        <PrimaryAmountContainer>
          <AmountInputContainer>
            <ModalBody>$</ModalBody>
            <AmountInput
              ref={inputRef}
              type="text"
              value={amountUsd}
              onChange={handleAmountChange}
            />
          </AmountInputContainer>
        </PrimaryAmountContainer>

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

const PrimaryAmountContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const AmountInputContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
`;

const AmountInput = styled.input`
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  outline: none;
  font-size: 30px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  color: var(--ck-body-color);
  width: ${(props) => {
    const length = props.value?.length || 1;
    // Reduce width when decimal or commas are present since they're smaller than normal chars
    const numPunctuations = (props.value?.match(/[.,]/g) || []).length;
    const adjustedLength = length - numPunctuations * 0.6;
    return `${Math.min(adjustedLength, 10)}ch`;
  }};
  min-width: 1ch;
  max-width: 10ch;
  transition: width 0.1s ease-out;
`;

export default SelectDepositAddressAmount;
