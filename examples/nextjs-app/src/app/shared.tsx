import { DaimoPayEvent, getChainExplorerByChainId } from "@daimo/pay-common";

export const APP_ID = "daimopay-demo";

export const DAIMOPAY_API_URL =
  process.env.NEXT_PUBLIC_DAIMOPAY_API_URL || "https://pay-api.daimo.xyz";

export const DAIMO_ADDRESS = "0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D";

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-4 ${className}`}>{children}</div>;
}

export function Columns({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 items-baseline">{children}</div>;
}

export function printEvent(e: DaimoPayEvent) {
  const url = getChainExplorerByChainId(e.chainId);
  console.log(`${e.type} payment ${e.paymentId}: ${url}/tx/${e.txHash}`);
}
