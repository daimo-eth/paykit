import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  PageContent,
} from "../../Common/Modal/styles";

import styled from "../../../styles/styled";
import { formatUsd, USD_DECIMALS } from "../../../utils/format";
import { isValidNumber } from "../../../utils/validateInput";
import AmountInputField from "../../Common/AmountInput/AmountInputField";
import Button from "../../Common/Button";
import ExternalPaymentSpinner from "../../Spinners/ExternalPaymentSpinner";

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
      <ExternalPaymentSpinner
        logoURI={selectedDepositAddressOption.logoURI}
        logoShape="circle"
      />
      <ModalContent>
        <AmountInputContainer>
          <AmountInputField value={usdInput} onChange={handleAmountChange} />
        </AmountInputContainer>
        {message && <ModalBody>{message}</ModalBody>}
        <Button onClick={handleContinue} disabled={continueDisabled}>
          Continue
        </Button>
      </ModalContent>
    </PageContent>
  );
};

const AmountInputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default SelectDepositAddressAmount;
