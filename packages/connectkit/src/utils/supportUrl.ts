import { DaimoPayOrder, writeDaimoPayOrderID } from "@daimo/common";

export function getSupportUrl(
  daimoPayOrder: DaimoPayOrder | undefined,
  screen: string,
) {
  const encodedOrderId =
    daimoPayOrder == null ? null : writeDaimoPayOrderID(daimoPayOrder.id);
  const email = "support@daimo.com";
  const subject = `Support with Daimo Pay Id ${encodedOrderId}`;

  let body = "";
  if (daimoPayOrder != null) {
    body += `Id: ${encodedOrderId}\n`;
    body += `Org Id: ${daimoPayOrder.orgId}\n`;
  }
  body += `Support requested on ${screen} screen at ${new Date().toISOString()}\n\n`;
  body += "Please explain the issue you are experiencing:\n\n";

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailtoUrl;
}
