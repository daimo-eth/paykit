// Exported utilities, useful for @daimo/pay users.
import { getDAv2Chains } from "@daimo/contract";
import packageJson from "../../package.json";

export const daimoPayVersion = packageJson.version;

/** Chain ids supported by Daimo Pay. */
export const supportedChainIds = new Set(
  [...getDAv2Chains(false), ...getDAv2Chains(true)].map((c) => c.chainId),
);
