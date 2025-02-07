import { WalletPaymentOption } from "@daimo/common";
import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export function useSolanaPaymentOptions({
  trpc,
  address,
  usdRequired,
}: {
  trpc: TrpcClient;
  address: string | undefined;
  usdRequired: number | undefined;
}) {
  const [options, setOptions] = useState<WalletPaymentOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      if (address == null || usdRequired == null) return;

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

    if (address != null && usdRequired != null) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired]);

  return {
    options,
    isLoading,
  };
}
