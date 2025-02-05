// Exported utilities, useful for @daimo/pay users.
import { writeDaimoPayOrderID } from "@daimo/common";
import { getDAv2Chains } from "@daimo/contract";
import { bytesToBigInt } from "viem";
import packageJson from "../../package.json";

export const daimoPayVersion = packageJson.version;

/** Generates a globally-unique payId. */
export function generatePayId(): string {
  const id = bytesToBigInt(crypto.getRandomValues(new Uint8Array(32)));
  return writeDaimoPayOrderID(id);
}

/** Chain ids supported by Daimo Pay. */
export const supportedChainIds = new Set(
  [...getDAv2Chains(false), ...getDAv2Chains(true)].map((c) => c.chainId),
);
