import {
  DaimoPayIntentStatus,
  DaimoPayOrderMode,
  DaimoPayOrderStatusSource,
  writeDaimoPayOrderID,
} from "@daimo/common";
import { usePayContext } from "../components/DaimoPay";

export function useDaimoPayStatus() {
  const { paymentInfo } = usePayContext();

  const status = (() => {
    if (!paymentInfo || !paymentInfo.daimoPayOrder) return undefined;
    const order = paymentInfo.daimoPayOrder;
    const paymentId = writeDaimoPayOrderID(order.id);
    if (order.mode === DaimoPayOrderMode.HYDRATED) {
      if (order.intentStatus != DaimoPayIntentStatus.PENDING) {
        return {
          status:
            order.intentStatus === DaimoPayIntentStatus.SUCCESSFUL
              ? "payment_completed"
              : "payment_bounced",
          paymentId,
        };
      } else if (
        order.sourceStatus != DaimoPayOrderStatusSource.WAITING_PAYMENT
      ) {
        return {
          status: "payment_started" as const,
          paymentId,
        };
      }
    }

    return {
      status: "payment_pending" as const,
      paymentId,
    };
  })();

  return status;
}
