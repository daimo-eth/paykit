import { Chain } from "viem";
import { useConfig } from "wagmi";

/** Returns currently configured wagmi chains. */
export function useChains() {
  const wagmi = useConfig();
  const chains = wagmi?.chains ?? [];
  return chains.map((c) => c) as Chain[];
}
