import { WalletBalance } from "@daimo/common";
import { useEffect, useState } from "react";
import { supportedChainIds } from "../utils/exports";
import { TrpcClient } from "../utils/trpc";

/** Wallet balances. Use picks one. */
export function useWalletBalances({
  trpc,
  address,
  destChainId,
  preferredChains,
  preferredTokens,
  isDepositFlow,
  log,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  destChainId: number | undefined;
  preferredChains: number[] | undefined;
  preferredTokens: { chain: number; address: string }[] | undefined;
  isDepositFlow: boolean;
  log: (msg: string) => void;
}) {
  const [balances, setBalances] = useState<WalletBalance[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletBalances = async () => {
      if (!address || !destChainId) return;

      setBalances(null);
      setIsLoading(true);
      try {
        const newBalances = await trpc.getWalletBalances.query({
          payerAddress: address,
          destChainId,
          preferredChains,
          preferredTokens,
        });

        // Filter out chains we don't support yet.
        const isSupported = (b: WalletBalance) =>
          supportedChainIds.has(b.balance.token.chainId);
        const filteredBalances = newBalances.filter(isSupported);
        if (filteredBalances.length < newBalances.length) {
          log(
            `[WALLET]: skipping ${newBalances.length - filteredBalances.length} unsupported-chain balances on ${address}`,
          );
        }

        setBalances(filteredBalances);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // No need to get balances for non-deposit flows. Payment options are fetched separately.
    if (!isDepositFlow) return;
    if (address != null && destChainId) {
      refreshWalletBalances();
    }
  }, [address, destChainId]);

  return {
    balances,
    isLoading,
  };
}
