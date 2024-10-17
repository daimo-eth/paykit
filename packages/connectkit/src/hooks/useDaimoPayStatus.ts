import { DaimoPayOrderMode, DaimoPayOrderStatusDest, DaimoPayOrderStatusSource, writeDaimoPayOrderID } from "@daimo/common";
import { useContext } from "../components/DaimoPay";

export function useDaimoPayStatus() {
  const { paymentInfo } = useContext();

  const status = (() => {
    if (!paymentInfo || !paymentInfo.daimoPayOrder) return undefined;
    const order = paymentInfo.daimoPayOrder;
    const paymentId = writeDaimoPayOrderID(order.id);
    if (order.mode === DaimoPayOrderMode.HYDRATED) {
      if (order.destStatus === DaimoPayOrderStatusDest.FAST_FINISHED || order.destStatus === DaimoPayOrderStatusDest.CLAIMED) {
        return {
          status: "payment_completed" as const,
          paymentId,
        }
      } else if (order.sourceStatus != DaimoPayOrderStatusSource.WAITING_PAYMENT) {
        return {
          status: "payment_started" as const,
          paymentId,
        }
      }
    }

    return {
      status: "payment_pending" as const,
      paymentId,
    }
  })();

  return status;
}
