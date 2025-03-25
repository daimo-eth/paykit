/**
 * Contract an Ethereum address to a shorter string.
 *
 * Example:
 * 0x1234567890123456789012345678901234567890
 * becomes
 * 0x1234…7890
 */
export function getAddressContraction(address: string, length = 4): string {
  return address.slice(0, 2 + length) + "…" + address.slice(-length);
}
