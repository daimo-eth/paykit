import { WalletPaymentOption } from "@daimo/common";
import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export function useSolanaPaymentOptions({
  trpc,
  address,
  usdRequired,
  isDepositFlow,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  usdRequired: number | undefined;
  isDepositFlow: boolean;
}) {
  const [options, setOptions] = useState<WalletPaymentOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      if (!address || !usdRequired) return;

      setOptions(null);
      setIsLoading(true);
      try {
        const newOptions = await trpc.getSolanaPaymentOptions.query({
          pubKey: address,
          usdRequired,
        });
        setOptions(newOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    // No need to get options for deposit. Balances are fetched separately.
    if (isDepositFlow) return;
    if (address && usdRequired != null) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, isDepositFlow]);

  return {
    options,
    isLoading,
  };
}
