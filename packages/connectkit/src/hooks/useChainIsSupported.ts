import { useConfig } from "wagmi";

/** Determines whether the current wagmi configuration supports a given chain. */
export function useChainIsSupported(chainId?: number): boolean | null {
  const { chains } = useConfig();
  if (!chainId) return false;
  return chains.some((x) => x.id === chainId);
}
