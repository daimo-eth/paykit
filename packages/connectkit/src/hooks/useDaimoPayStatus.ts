import {
  DaimoPayIntentStatus,
  DaimoPayOrderMode,
  DaimoPayOrderStatusSource,
  PaymentStatus,
  writeDaimoPayOrderID,
} from "@daimo/common";
import { useContext } from "../components/DaimoPay";

export type DaimoPayStatus = {
  paymentId: string;
  status: PaymentStatus;
};

export function useDaimoPayStatus(): DaimoPayStatus | undefined {
  const { paymentInfo } = useContext();

  if (!paymentInfo || !paymentInfo.daimoPayOrder) return undefined;
  const order = paymentInfo.daimoPayOrder;
  const paymentId = writeDaimoPayOrderID(order.id);

  const status = (() => {
    if (order.mode === DaimoPayOrderMode.HYDRATED) {
      if (order.intentStatus !== DaimoPayIntentStatus.PENDING) {
        return order.intentStatus === DaimoPayIntentStatus.SUCCESSFUL
          ? PaymentStatus.Completed
          : PaymentStatus.Bounced;
      } else if (
        order.sourceStatus !== DaimoPayOrderStatusSource.WAITING_PAYMENT
      ) {
        return PaymentStatus.Started;
      }
    }
    return PaymentStatus.Pending;
  })();

  return { paymentId, status };
}
