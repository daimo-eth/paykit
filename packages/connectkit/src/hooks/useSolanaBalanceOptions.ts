import { WalletBalanceOption } from "@daimo/common";
import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

/** Wallet balance options for deposit flow. User picks one. */
export function useSolanaBalanceOptions({
  trpc,
  address,
  isDepositFlow,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  isDepositFlow: boolean;
}) {
  const [options, setOptions] = useState<WalletBalanceOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      if (!address) return;

      setOptions(null);
      setIsLoading(true);
      try {
        const newOptions = await trpc.getSolanaBalanceOptions.query({
          pubKey: address,
        });
        setOptions(newOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // No need to get balances for non-deposit flows. Payment options are fetched separately.
    if (!isDepositFlow) return;
    if (address != null) {
      refreshWalletPaymentOptions();
    }
  }, [address, isDepositFlow]);

  return {
    options,
    isLoading,
  };
}
