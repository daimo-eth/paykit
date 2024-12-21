import {
  DaimoPayIntentStatus,
  DaimoPayOrderMode,
  DaimoPayOrderStatusSource,
  writeDaimoPayOrderID,
} from "@daimo/common";
import { usePayContext } from "../components/DaimoPay";
import { PaymentStatus } from "../types";

/** Returns the current payment, or undefined if there is none.
 *
 * Status values:
 * - `payment_pending` - the user has not paid yet
 * - `payment_started` - the user has paid & payment is in progress. This status
 *    typically lasts a few seconds.
 * - `payment_completed` - the final call or transfer succeeded
 * - `payment_bounced` - the final call or transfer reverted. Funds were sent
 *    to the payment's configured refund address on the destination chain.
 */
export function useDaimoPayStatus():
  | { paymentId: string; status: PaymentStatus }
  | undefined {
  const { paymentState } = usePayContext();
  if (!paymentState || !paymentState.daimoPayOrder) return undefined;

  const order = paymentState.daimoPayOrder;
  const paymentId = writeDaimoPayOrderID(order.id);
  if (order.mode === DaimoPayOrderMode.HYDRATED) {
    if (order.intentStatus !== DaimoPayIntentStatus.PENDING) {
      if (order.intentStatus === DaimoPayIntentStatus.SUCCESSFUL) {
        return { paymentId, status: "payment_completed" };
      } else {
        return { paymentId, status: "payment_bounced" };
      }
    } else if (
      order.sourceStatus !== DaimoPayOrderStatusSource.WAITING_PAYMENT
    ) {
      return { paymentId, status: "payment_started" };
    }
  }

  return { paymentId, status: "payment_pending" };
}
