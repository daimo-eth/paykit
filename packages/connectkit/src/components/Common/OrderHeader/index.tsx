import { DaimoPayOrderMode } from "@daimo/common";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Arbitrum,
  Base,
  Ethereum,
  Optimism,
  Polygon,
  Solana,
} from "../../../assets/chains";
import { USDC } from "../../../assets/coins";
import defaultTheme from "../../../constants/defaultTheme";
import styled from "../../../styles/styled";
import { usePayContext } from "../../DaimoPay";
import Button from "../Button";

const CoinLogos = ({ $size = 24 }: { $size?: number }) => {
  const logos = [
    <Ethereum />,
    <USDC />,
    <Optimism />,
    <Arbitrum />,
    <Base />,
    <Polygon />,
    <Solana />,
  ];

  const logoBlock = (element: React.ReactElement, index: number) => (
    <LogoContainer
      key={index}
      $marginLeft={index !== 0 ? -($size / 3) : 0}
      $zIndex={logos.length - index}
      $size={$size}
      transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 0.98] }}
    >
      {element}
    </LogoContainer>
  );

  return (
    <Logos>{logos.map((element, index) => logoBlock(element, index))}</Logos>
  );
};

const InputUnderlineField = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) => {
  // subtract width for decimal point if necessary
  const width = value.length - 0.5 * (value.includes(".") ? 1 : 0) + "ch";

  const selectAll = (e: React.FocusEvent<HTMLInputElement>) => {
    // When entering edit mode, select the amount for quicker editing
    setTimeout(() => e.target.select(), 100);
  };

  return (
    <div style={{ width: "auto", position: "relative" }}>
      <InputField
        $width={width}
        type="text"
        pattern="\d*.\d{2}"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={selectAll}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <Underline />
    </div>
  );
};

const InputField = styled(motion.input)<{ $width?: string }>`
  box-sizing: border-box;
  background-color: transparent;
  outline: none;
  width: ${(props) => props.$width || "5ch"};
  line-height: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  border: none;
  padding: 0;
  &:focus {
    box-sizing: border-box;
    outline: none;
    border: none;
  }
`;

const Underline = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--ck-body-color-muted);
`;

export const OrderHeader = ({ minified = false }: { minified?: boolean }) => {
  const { paymentInfo } = usePayContext();

  const amount =
    paymentInfo.daimoPayOrder?.destFinalCallTokenAmount.usd.toFixed(2);
  const isEditable =
    paymentInfo.daimoPayOrder?.mode === DaimoPayOrderMode.CHOOSE_AMOUNT;

  const [editableAmount, setEditableAmount] = useState<string>(amount ?? "");

  // Start out in edit mode immediately if amount = 0.
  const [isEditing, setIsEditing] = useState<boolean>(amount === "0.00");

  const handleSave = () => {
    if (!isEditing) return;
    paymentInfo.setChosenUsd(Number(editableAmount));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isEditing) {
      handleSave();
    }
  };

  const sanitizeAndSetAmount = (amount: string) => {
    if (!amount.match(/^[0-9]*(\.[0-9]{0,2})?$/)) {
      return;
    }

    const [digitsBeforeDecimal, digitsAfterDecimal] = (() => {
      if (amount.includes(".")) return amount.split(".");
      else return [amount, ""];
    })();

    if (digitsBeforeDecimal.length > 5 || digitsAfterDecimal.length > 2) {
      return;
    }
    setEditableAmount(amount);
  };

  const titleAmountContent = (() => {
    const buttonStyles = (() => {
      if (minified)
        return {
          height: "24px",
          width: "42px",
          lineHeight: "12px",
          borderRadius: "6px",
          fontSize: "14px",
        };
      else
        return {
          height: "30px",
          width: "54px",
          lineHeight: "16px",
          borderRadius: "8px",
          fontSize: "20px",
        };
    })();

    return (
      <>
        {isEditable && !minified && (
          <div
            style={{ width: buttonStyles.width, height: buttonStyles.height }}
          ></div>
        )}
        {!isEditing ? (
          <span>${amount}</span>
        ) : (
          <div style={{ display: "flex" }}>
            $
            <InputUnderlineField
              value={editableAmount}
              onChange={(e) => sanitizeAndSetAmount(e.target.value)}
              onBlur={(e) => {
                if (!e.relatedTarget) {
                  setIsEditing(false);
                }
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
        {isEditable && (
          <Button
            variant="primary"
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            style={{
              width: buttonStyles.width,
              height: buttonStyles.height,
              lineHeight: buttonStyles.lineHeight,
              borderRadius: buttonStyles.borderRadius,
              fontSize: buttonStyles.fontSize,
              margin: 0,
            }}
          >
            {isEditing ? "Save" : "Edit"}
          </Button>
        )}
      </>
    );
  })();

  if (minified) {
    return (
      <MinifiedContainer>
        <MinifiedTitleAmount>{titleAmountContent}</MinifiedTitleAmount>
        <CoinLogos $size={32} />
      </MinifiedContainer>
    );
  } else {
    return (
      <>
        <TitleAmount>{titleAmountContent}</TitleAmount>

        <AnyChainAnyCoinContainer>
          <CoinLogos />
          <Subtitle>1000+ tokens accepted</Subtitle>
        </AnyChainAnyCoinContainer>
      </>
    );
  }
};

const TitleAmount = styled(motion.h1)<{
  $error?: boolean;
  $valid?: boolean;
}>`
  margin: 0;
  padding: 0;
  line-height: 66px;
  font-size: 64px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  color: ${(props) => {
    if (props.$error) return "var(--ck-body-color-danger)";
    if (props.$valid) return "var(--ck-body-color-valid)";
    return "var(--ck-body-color)";
  }};
  @media only screen and (max-width: ${defaultTheme.mobileWidth}px) {
    font-size: 64px;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Subtitle = styled(motion.div)`
  font-size: 18px;
  font-weight: 500;
  line-height: 21px;
  color: var(--ck-body-color-muted);
`;

const MinifiedTitleAmount = styled(motion.div)`
  font-size: 32px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  line-height: 36px;
  color: var(--ck-body-color);
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 8px;
`;

const MinifiedContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 24px;
`;

const AnyChainAnyCoinContainer = styled(motion.div)`
  display: flex;
  vertical-align: middle;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  margin: 24px 0;
`;

const LogoContainer = styled(motion.div)<{
  $marginLeft?: number;
  $zIndex?: number;
  $size: number;
}>`
  display: block;
  overflow: hidden;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${(props) => props.$marginLeft || 0}px;
  z-index: ${(props) => props.$zIndex || 2};
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 9999px;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const Logos = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
