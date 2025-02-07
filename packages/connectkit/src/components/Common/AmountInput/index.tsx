import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  PageContent,
} from "../../Common/Modal/styles";

import {
  assertNotNull,
  WalletBalanceOption,
  WalletPaymentOption,
} from "@daimo/common";
import { AnimatePresence, motion } from "framer-motion";
import { css } from "styled-components";
import { formatUnits, parseUnits } from "viem";
import { chainToLogo } from "../../../assets/chains";
import styled from "../../../styles/styled";
import {
  formatUsd,
  roundDecimals,
  tokenAmountToFormattedUsd,
  USD_DECIMALS,
  usdToFormattedTokenAmount,
} from "../../../utils/format";
import { isValidNumber } from "../../../utils/validateInput";
import Button from "../../Common/Button";
import SwitchButton from "../../Common/SwitchButton";
import CircleSpinner from "../../Spinners/CircleSpinner";
import AmountInputField from "./AmountInputField";

const MAX_USD_VALUE = 20000;

const MultiCurrencySelectAmount: React.FC<{
  selectedTokenBalance: WalletBalanceOption;
  setSelectedTokenOption: (option: WalletPaymentOption) => void;
  nextPage: ROUTES;
}> = ({ selectedTokenBalance, setSelectedTokenOption, nextPage }) => {
  const { paymentState, setRoute, triggerResize } = usePayContext();

  const balanceToken = selectedTokenBalance.balance.token;
  const isUsdStablecoin = balanceToken.fiatSymbol === "$";

  const minimumMessage =
    selectedTokenBalance.minimumRequired.usd > 0
      ? `Minimum 
  ${formatUsd(selectedTokenBalance.minimumRequired.usd, "up")}`
      : null;

  const [editableValue, setEditableValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState(
    usdToFormattedTokenAmount(0, selectedTokenBalance.balance.token),
  );
  const [isEditingUsd, setIsEditingUsd] = useState(true);
  const [message, setMessage] = useState<string | null>(minimumMessage);
  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    triggerResize();
  }, [message]);

  /**
   * Update the editable value and secondary value, taking into account whether
   * the user is currently editing the USD value or the token value.
   */
  const updateValues = (
    newEditableValue: string,
    isUsdValue: boolean,
    newSecondaryValue?: string,
  ) => {
    const sanitizedEditableValue = /\d/.test(newEditableValue)
      ? newEditableValue
      : "0";

    let usdValue: string;
    let tokenValue: string;

    if (isUsdValue) {
      usdValue = roundDecimals(
        Number(sanitizedEditableValue),
        USD_DECIMALS,
        "down",
      );
      if (newSecondaryValue != null) {
        const sanitizedSecondaryValue = /\d/.test(newSecondaryValue)
          ? newSecondaryValue
          : "0";
        tokenValue = roundDecimals(
          Number(sanitizedSecondaryValue),
          balanceToken.displayDecimals,
          "down",
        );
      } else {
        tokenValue = usdToFormattedTokenAmount(
          Number(sanitizedEditableValue),
          balanceToken,
          "down",
        );
      }
    } else {
      tokenValue = roundDecimals(
        Number(sanitizedEditableValue),
        balanceToken.displayDecimals,
        "down",
      );
      if (newSecondaryValue != null) {
        const sanitizedSecondaryValue = /\d/.test(newSecondaryValue)
          ? newSecondaryValue
          : "0";
        usdValue = roundDecimals(
          Number(sanitizedSecondaryValue),
          USD_DECIMALS,
          "down",
        );
      } else {
        usdValue = tokenAmountToFormattedUsd(
          parseUnits(sanitizedEditableValue, balanceToken.decimals),
          balanceToken,
          "down",
        );
      }
    }

    // Update the state
    setEditableValue(newEditableValue);
    setSecondaryValue(isUsdValue ? tokenValue : usdValue);
    setIsEditingUsd(isUsdValue);

    setContinueDisabled(
      Number(usdValue) <= 0 ||
        Number(usdValue) < selectedTokenBalance.minimumRequired.usd ||
        Number(usdValue) > selectedTokenBalance.balance.usd ||
        Number(usdValue) > MAX_USD_VALUE,
    );

    if (Number(usdValue) > selectedTokenBalance.balance.usd) {
      setMessage(
        `Amount exceeds your balance: 
  ${formatUsd(selectedTokenBalance?.balance.usd, "down")}`,
      );
    } else if (Number(usdValue) > MAX_USD_VALUE) {
      setMessage(`Maximum ${formatUsd(MAX_USD_VALUE)}`);
    } else {
      setMessage(minimumMessage);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maxDecimals = isEditingUsd
      ? USD_DECIMALS
      : balanceToken.displayDecimals;
    if (value !== "" && !isValidNumber(value, maxDecimals)) return;
    updateValues(value, isEditingUsd);
  };

  const handleMax = () => {
    const usdValue = roundDecimals(
      Number(selectedTokenBalance.balance.usd),
      USD_DECIMALS,
      "down",
    );
    const tokenValue = roundDecimals(
      Number(
        formatUnits(
          BigInt(selectedTokenBalance.balance.amount),
          balanceToken.decimals,
        ),
      ),
      balanceToken.displayDecimals,
      "down",
    );
    updateValues(
      isEditingUsd ? usdValue : tokenValue,
      isEditingUsd,
      isEditingUsd ? tokenValue : usdValue,
    );
  };

  const handleSwitchCurrency = () => {
    updateValues(secondaryValue, !isEditingUsd, editableValue);
  };

  const handleContinue = () => {
    const usd = Number(isEditingUsd ? editableValue : secondaryValue);
    const amountUnits = usd / balanceToken.usd;
    const amount = parseUnits(amountUnits.toString(), balanceToken.decimals);
    setSelectedTokenOption({
      required: {
        token: assertNotNull(
          balanceToken,
          `Token is null for ${balanceToken.token} on chain ${balanceToken.chainId}`,
        ),
        amount: `${BigInt(amount)}`,
        usd,
      },
      ...selectedTokenBalance!,
    });
    paymentState.setChosenUsd(Number(usd));
    setRoute(nextPage);
  };

  return (
    <PageContent>
      <LoadingContainer>
        <AnimationContainer $circle={true}>
          <AnimatePresence>
            {chainToLogo[balanceToken.chainId] && (
              <ChainLogoContainer key="ChainLogoContainer">
                {chainToLogo[balanceToken.chainId]}
              </ChainLogoContainer>
            )}
            <CircleSpinner
              key="CircleSpinner"
              logo={
                <img
                  src={balanceToken.logoURI}
                  alt={balanceToken.symbol}
                  key={balanceToken.logoURI}
                />
              }
              loading={true}
              unavailable={false}
            />
          </AnimatePresence>
        </AnimationContainer>
      </LoadingContainer>
      <ModalContent>
        <AmountInputContainer>
          {/* Invisible div to balance spacing */}
          <MaxButton style={{ visibility: "hidden" }}>Max</MaxButton>
          <AmountInputField
            value={editableValue}
            onChange={handleAmountChange}
            currency={isEditingUsd ? "$" : balanceToken.symbol}
          />
          <MaxButton onClick={handleMax}>Max</MaxButton>
        </AmountInputContainer>

        {!isUsdStablecoin && (
          <SwitchContainer>
            <SwitchButton onClick={handleSwitchCurrency}>
              <SecondaryAmount>
                {isEditingUsd
                  ? `${secondaryValue} ${balanceToken.symbol}`
                  : `$${secondaryValue}`}
              </SecondaryAmount>
            </SwitchButton>
          </SwitchContainer>
        )}

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

const AmountInputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

export default MultiCurrencySelectAmount;
