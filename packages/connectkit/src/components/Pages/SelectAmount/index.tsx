import React, { useEffect, useRef, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  PageContent,
} from "../../Common/Modal/styles";

import { assert, assertNotNull } from "@daimo/common";
import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import { formatUnits, parseUnits } from "viem";
import { chainToLogo } from "../../../assets/chains";
import styled from "../../../styles/styled";
import {
  formatUsd,
  roundDecimals,
  tokenAmountToUsd,
  USD_DECIMALS,
  usdToTokenAmount,
} from "../../../utils/format";
import Button from "../../Common/Button";
import SwitchIcon from "../../Common/Switch";
import CircleSpinner from "../../Spinners/CircleSpinner";

const SelectAmount: React.FC = () => {
  const { paymentState, setRoute, triggerResize } = usePayContext();
  const { selectedTokenBalance, setSelectedTokenOption } = paymentState;
  assert(selectedTokenBalance != null, "Selected token balance is null");

  const token = selectedTokenBalance.balance.token;
  const minimumMessage =
    selectedTokenBalance.minimumRequired.usd > 0
      ? `Minimum 
  ${formatUsd(selectedTokenBalance?.minimumRequired.usd, "up")}`
      : null;

  const [editableAmount, setEditableAmount] = useState("");
  const [secondaryAmount, setSecondaryAmount] = useState(
    usdToTokenAmount(0, token),
  );
  const [isEditingUsd, setIsEditingUsd] = useState(true);
  const [message, setMessage] = useState<string | null>(minimumMessage);
  const [continueDisabled, setContinueDisabled] = useState(true);

  // Focus the AmountInput when the page loads and when the user switches currencies
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [isEditingUsd]);

  useEffect(() => {
    triggerResize();
  }, [message]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Test that the value is digits, followed by an optional decimal, followed
    // by more digits
    if (!(value === "" || /^\d+\.?\d*$/.test(value))) return;

    const sanitizedValue = /\d/.test(value) ? value : "0";

    // Check if the value has too many decimal places
    const maxDecimals = isEditingUsd ? USD_DECIMALS : token.displayDecimals;
    const [, digitsAfterDecimal] = (() => {
      if (value.includes(".")) return value.split(".");
      else return [value, ""];
    })();
    if (digitsAfterDecimal.length > maxDecimals) {
      return;
    }

    // TODO: this check needs to be more nuanced. e.g. user has balance greater than 20k
    // Check if the value is too large
    const MAX_USD_VALUE = 20000;
    const usdValue = isEditingUsd
      ? sanitizedValue
      : tokenAmountToUsd(parseUnits(sanitizedValue, token.decimals), token);
    const tokenValue = isEditingUsd
      ? usdToTokenAmount(Number(sanitizedValue), token)
      : sanitizedValue;
    if (Number(usdValue) > MAX_USD_VALUE) {
      return;
    }

    // Update the state
    setEditableAmount(value);
    setSecondaryAmount(isEditingUsd ? tokenValue : usdValue);

    setContinueDisabled(
      value === "" ||
        Number(value) <= 0 ||
        Number(value) < selectedTokenBalance.minimumRequired.usd ||
        Number(value) > selectedTokenBalance.balance.usd,
    );

    if (Number(usdValue) > selectedTokenBalance.balance.usd) {
      setMessage(
        `Amount exceeds your balance: 
  ${formatUsd(selectedTokenBalance?.balance.usd, "down")}`,
      );
    } else {
      setMessage(minimumMessage);
    }
  };

  const handleMax = () => {
    // Round down so the amount won't exceed the balance
    if (isEditingUsd) {
      setEditableAmount(
        roundDecimals(selectedTokenBalance.balance.usd, USD_DECIMALS, "down"),
      );
      setSecondaryAmount(
        usdToTokenAmount(selectedTokenBalance.balance.usd, token),
      );
    } else {
      const amount = BigInt(selectedTokenBalance.balance.amount);
      const amountUnits = formatUnits(amount, token.decimals);
      setEditableAmount(
        roundDecimals(Number(amountUnits), token.displayDecimals, "down"),
      );
      setSecondaryAmount(tokenAmountToUsd(amount, token));
    }
  };

  const handleSwitchCurrency = () => {
    const temp = editableAmount;
    setEditableAmount(secondaryAmount);
    setSecondaryAmount(temp);
    setIsEditingUsd(!isEditingUsd);
  };

  const handleContinue = () => {
    const usd = isEditingUsd
      ? editableAmount
      : tokenAmountToUsd(parseUnits(editableAmount, token.decimals), token);
    const amountUnits = isEditingUsd
      ? usdToTokenAmount(Number(editableAmount), token)
      : editableAmount;
    const amount = parseUnits(amountUnits, token.decimals);
    setSelectedTokenOption({
      required: {
        token: assertNotNull(
          selectedTokenBalance?.balance.token,
          `Token is null for ${selectedTokenBalance?.balance.token.token} on chain ${selectedTokenBalance?.balance.token.chainId}`,
        ),
        amount: `${BigInt(amount)}`,
        usd: Number(usd),
      },
      ...selectedTokenBalance!,
    });
    paymentState.setChosenUsd(Number(editableAmount));
    setRoute(ROUTES.PAY_WITH_TOKEN);
  };

  return (
    <PageContent>
      <LoadingContainer>
        <AnimationContainer $circle={true}>
          <AnimatePresence>
            <ChainLogoContainer key="ChainLogoContainer">
              {selectedTokenBalance &&
                chainToLogo[selectedTokenBalance.balance.token.chainId]}
            </ChainLogoContainer>
            <CircleSpinner
              key="CircleSpinner"
              logo={
                <img
                  src={selectedTokenBalance?.balance.token.logoURI}
                  alt={selectedTokenBalance?.balance.token.symbol}
                  key={selectedTokenBalance?.balance.token.logoURI}
                />
              }
              loading={true}
              unavailable={false}
            />
          </AnimatePresence>
        </AnimationContainer>
      </LoadingContainer>
      <ModalContent>
        <PrimaryAmountContainer>
          {/* Invisible div to balance spacing */}
          <MaxButton style={{ visibility: "hidden" }}>Max</MaxButton>
          <AmountInputContainer>
            <ModalBody>{isEditingUsd ? "$" : ""}</ModalBody>
            <AmountInput
              ref={inputRef}
              type="text"
              value={editableAmount}
              onChange={handleAmountChange}
            />
            <ModalBody>{isEditingUsd ? "" : token.symbol}</ModalBody>
          </AmountInputContainer>
          <MaxButton onClick={handleMax}>Max</MaxButton>
        </PrimaryAmountContainer>

        <SwitchContainer>
          <SwitchIcon onClick={handleSwitchCurrency}>
            <SecondaryAmount>
              {isEditingUsd
                ? `${secondaryAmount} ${token.symbol}`
                : `$${secondaryAmount}`}
            </SecondaryAmount>
          </SwitchIcon>
        </SwitchContainer>

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
    const adjustedLength = length - numPunctuations * 0.7;
    return `${Math.min(adjustedLength, 10)}ch`;
  }};
  min-width: 1ch;
  max-width: 10ch;
  transition: width 0.1s ease-out;
`;

const SecondaryAmount = styled.div`
  font-size: 16px;
  font-weight: 400;
  line-height: 21px;
  color: var(--ck-body-color-muted);
  strong {
    font-weight: 500;
    color: var(--ck-body-color);
  }
`;

const MaxButton = styled.button`
  display: inline-block;
  padding: 3px 8px;
  border-radius: var(--ck-primary-button-border-radius);
  font-size: 14px;
  font-weight: 400;
  background: var(
    --ck-secondary-button-background,
    var(--ck-body-background-secondary)
  );
  color: var(--ck-body-color-muted);
  cursor: pointer;
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default SelectAmount;
