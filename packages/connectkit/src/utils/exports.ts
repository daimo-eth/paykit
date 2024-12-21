// Exported utilities, useful for @daimo/pay users.

import { bytesToBigInt } from "viem";

/** Generates a globally-unique 32-byte nonce. */
export function generateNonce(): bigint {
  return bytesToBigInt(crypto.getRandomValues(new Uint8Array(32)));
}
