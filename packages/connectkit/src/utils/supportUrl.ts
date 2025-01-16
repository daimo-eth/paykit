import { DaimoPayOrder } from "@daimo/common";

export function getSupportUrl(
  daimoPayOrder: DaimoPayOrder | undefined,
  screen: string,
) {
  const email = "support@daimo.com";
  const subject = `Support with Daimo Pay Order Id ${daimoPayOrder?.id}`;

  let body = "";
  if (daimoPayOrder != null) {
    body += `Order Id: ${daimoPayOrder.id}\n`;
    body += `Org Id: ${daimoPayOrder.orgId}\n`;
  }
  body += `Support requested on ${screen} screen at ${new Date().toISOString()}\n\n`;
  body += "Please explain the issue you are experiencing:\n\n";

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailtoUrl;
}
