import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export type WalletPaymentOption = Awaited<
  ReturnType<TrpcClient["getWalletPaymentOptions"]["query"]>
>[0];

export function useWalletPaymentOptions({
  trpc,
  address,
  usdRequired,
  destChainId,
  preferredChains,
  preferredTokens,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  usdRequired: number | undefined;
  destChainId: number | undefined;
  preferredChains: number[] | undefined;
  preferredTokens: { chain: number; address: string }[] | undefined;
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
        setOptions(newOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address && usdRequired != null && destChainId) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, destChainId]);

  return {
    options,
    isLoading,
  };
}
