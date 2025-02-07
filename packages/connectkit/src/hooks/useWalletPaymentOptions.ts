import { WalletPaymentOption } from "@daimo/common";
import { useEffect, useState } from "react";
import { supportedChainIds } from "../utils/exports";
import { TrpcClient } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export function useWalletPaymentOptions({
  trpc,
  address,
  usdRequired,
  destChainId,
  preferredChains,
  preferredTokens,
  isDepositFlow,
  log,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  usdRequired: number | undefined;
  destChainId: number | undefined;
  preferredChains: number[] | undefined;
  preferredTokens: { chain: number; address: string }[] | undefined;
  isDepositFlow: boolean;
  log: (msg: string) => void;
}) {
  const [options, setOptions] = useState<WalletPaymentOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      if (!address || !usdRequired || !destChainId) return;

      setOptions(null);
      setIsLoading(true);
      try {
        const newOptions = await trpc.getWalletPaymentOptions.query({
          payerAddress: address,
          usdRequired,
          destChainId,
          preferredChains,
          preferredTokens,
        });

        // Filter out chains we don't support yet.
        const isSupported = (o: WalletPaymentOption) =>
          supportedChainIds.has(o.balance.token.chainId);
        const filteredOptions = newOptions.filter(isSupported);
        if (filteredOptions.length < newOptions.length) {
          log(
            `[WALLET]: skipping ${newOptions.length - filteredOptions.length} unsupported-chain balances on ${address}`,
          );
        }

        setOptions(filteredOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // No need to get options for deposit. Balances are fetched separately.
    if (isDepositFlow) return;
    if (address && usdRequired != null && destChainId) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, destChainId, isDepositFlow]);

  return {
    options,
    isLoading,
  };
}
