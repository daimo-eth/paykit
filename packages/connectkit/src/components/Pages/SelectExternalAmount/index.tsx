import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  PageContent,
} from "../../Common/Modal/styles";

import styled from "../../../styles/styled";
import { formatUsd, USD_DECIMALS } from "../../../utils/format";
import { isValidNumber, sanitizeNumber } from "../../../utils/validateInput";
import AmountInputField from "../../Common/AmountInput/AmountInputField";
import Button from "../../Common/Button";
import ExternalPaymentSpinner from "../../Spinners/ExternalPaymentSpinner";

const SelectExternalAmount: React.FC = () => {
  const { paymentState, setRoute, triggerResize } = usePayContext();
  const { selectedExternalOption } = paymentState;

  const maxUsdLimit = paymentState.getOrderUsdLimit();
  const minimumMessage =
    (selectedExternalOption?.minimumUsd ?? 0) > 0
      ? `Minimum ${formatUsd(selectedExternalOption?.minimumUsd ?? 0, "up")}`
      : null;

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

    if (Number(value) > maxUsdLimit) {
      setMessage(`Maximum ${formatUsd(maxUsdLimit)}`);
    } else {
      setMessage(minimumMessage);
    }

    const usd = Number(sanitizeNumber(value));
    setContinueDisabled(
      usd <= 0 ||
        usd < (selectedExternalOption.minimumUsd ?? 0) ||
        usd > maxUsdLimit,
    );
  };

  const handleContinue = () => {
    paymentState.setChosenUsd(Number(sanitizeNumber(usdInput)));
    setRoute(ROUTES.WAITING_EXTERNAL);
  };

  return (
    <PageContent>
      <ExternalPaymentSpinner
        logoURI={selectedExternalOption.logoURI}
        logoShape={selectedExternalOption.logoShape}
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

export default SelectExternalAmount;
