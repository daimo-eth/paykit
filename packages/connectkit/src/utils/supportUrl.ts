import { DaimoPayOrder, writeDaimoPayOrderID } from "./daimoPay";
import { daimoPayVersion } from "./exports";

export function getSupportUrl(
  daimoPayOrder: DaimoPayOrder | undefined,
  screen: string,
) {
  const payId =
    daimoPayOrder == null ? null : writeDaimoPayOrderID(daimoPayOrder.id);

  const email = "support@daimo.com";
  const subject = `Support${payId ? ` #${payId}` : ""}`;
  let body = [
    `Transaction: ${screen}`,
    `Version: ${daimoPayVersion}`,
    ``,
    `Tell us how we can help`,
  ].join("\n");

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
