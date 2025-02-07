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
import { formatUnits, parseUnits } from "viem";
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
import TokenLogoSpinner from "../../Spinners/TokenLogoSpinner";
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
    const sanitizedEditableValue = /^\d+\.?\d*$/.test(newEditableValue)
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
        const sanitizedSecondaryValue = /^\d+\.?\d*$/.test(newSecondaryValue)
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
        const sanitizedSecondaryValue = /^\d+\.?\d*$/.test(newSecondaryValue)
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
      <TokenLogoSpinner token={balanceToken} />
      <ModalContent $preserveDisplay={true}>
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
