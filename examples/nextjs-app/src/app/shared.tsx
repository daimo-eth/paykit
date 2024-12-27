import { DaimoPayEvent } from "@daimo/common";
import { getChainExplorerByChainId } from "@daimo/contract";

export const APP_ID = "daimopay-demo";

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export function Columns({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 items-baseline">{children}</div>;
}

export function printEvent(e: DaimoPayEvent) {
  const url = getChainExplorerByChainId(e.chainId);
  console.log(`${e.type} payment ${e.paymentId}: ${url}/tx/${e.txHash}`);
}
