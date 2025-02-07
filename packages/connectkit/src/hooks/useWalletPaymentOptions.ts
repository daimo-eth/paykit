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
  log,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  usdRequired: number | undefined;
  destChainId: number | undefined;
  preferredChains: number[] | undefined;
  preferredTokens: { chain: number; address: string }[] | undefined;
  log: (msg: string) => void;
}) {
  const [options, setOptions] = useState<WalletPaymentOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      if (address == null || usdRequired == null || destChainId == null) return;

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

    if (address != null && usdRequired != null && destChainId != null) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, destChainId]);

  return {
    options,
    isLoading,
  };
}
