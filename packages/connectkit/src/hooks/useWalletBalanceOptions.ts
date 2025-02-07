import { WalletBalanceOption } from "@daimo/common";
import { useEffect, useState } from "react";
import { supportedChainIds } from "../utils/exports";
import { TrpcClient } from "../utils/trpc";

/** Wallet balance options for deposit flow. User picks one. */
export function useWalletBalanceOptions({
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
  const [options, setOptions] = useState<WalletBalanceOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletBalances = async () => {
      if (!address || !destChainId) return;

      setOptions(null);
      setIsLoading(true);
      try {
        const newBalances = await trpc.getWalletBalanceOptions.query({
          payerAddress: address,
          destChainId,
          preferredChains,
          preferredTokens,
        });

        // Filter out chains we don't support yet.
        const isSupported = (b: WalletBalanceOption) =>
          supportedChainIds.has(b.balance.token.chainId);
        const filteredBalances = newBalances.filter(isSupported);
        if (filteredBalances.length < newBalances.length) {
          log(
            `[WALLET]: skipping ${newBalances.length - filteredBalances.length} unsupported-chain balances on ${address}`,
          );
        }

        setOptions(filteredBalances);
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
  }, [address, destChainId, isDepositFlow]);

  return {
    options,
    isLoading,
  };
}
