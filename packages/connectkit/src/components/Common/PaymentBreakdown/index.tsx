import React from "react";

import { WalletPaymentOption } from "@daimo/common";
import defaultTheme from "../../../constants/defaultTheme";
import styled from "../../../styles/styled";
import { ModalBody } from "../../Common/Modal/styles";

const PaymentBreakdown: React.FC<{
  paymentOption: WalletPaymentOption;
}> = ({ paymentOption }) => {
  const totalUsd = paymentOption.required.usd;
  const feesUsd = paymentOption.fees.usd;
  const subtotalUsd = totalUsd - feesUsd;

  return (
    <FeesContainer>
      {feesUsd > 0 && (
        <FeeRow>
          <ModalBody>Subtotal</ModalBody>
          <ModalBody>${subtotalUsd.toFixed(2)}</ModalBody>
        </FeeRow>
      )}
      <FeeRow>
        <ModalBody>Fees</ModalBody>
        {feesUsd === 0 ? (
          <Badge>Free</Badge>
        ) : (
          <ModalBody>${feesUsd.toFixed(2)}</ModalBody>
        )}
      </FeeRow>
      <FeeRow style={{ marginTop: 8 }}>
        <ModalBody style={{ fontWeight: 600 }}>Total</ModalBody>
        <ModalBody style={{ fontWeight: 600 }}>
          ${totalUsd.toFixed(2)}
        </ModalBody>
      </FeeRow>
    </FeesContainer>
  );
};

const FeesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 4px;
  margin: 16px 0;

  @media only screen and (max-width: ${defaultTheme.mobileWidth}px) {
    & ${ModalBody} {
      margin: 0 !important;
      max-width: 100% !important;
      text-align: left !important;
    }
  }
`;
const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
`;
const Badge = styled.span`
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
`;

export default PaymentBreakdown;
