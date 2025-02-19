import { assertNotNull, writeDaimoPayOrderID } from "@daimo/common";
import React from "react";
import { ModalBody, ModalH1 } from "../../Common/Modal/styles";
import { usePayContext } from "../../DaimoPay";

export const OtherDevice: React.FC = () => {
  const { paymentState } = usePayContext();

  const payment = assertNotNull(
    paymentState.daimoPayOrder,
    "[OTHER DEVICE] missing payment",
  );
  const payId = writeDaimoPayOrderID(payment.id);

  const url = `https://pay.daimo.com/checkout?id=${payId}`;

  return (
    <div>
      <ModalH1>Hello World</ModalH1>
      <ModalBody>{url}</ModalBody>
    </div>
  );
};
