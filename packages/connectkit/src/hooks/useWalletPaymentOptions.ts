import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export type WalletPaymentOption = Awaited<
  ReturnType<typeof trpc.getWalletPaymentOptions.query>
>[0];

export function useWalletPaymentOptions({
  address,
  usdRequired,
  destChainId,
}: {
  address: string | undefined;
  usdRequired: number | undefined;
  destChainId: number | undefined;
}) {
  const [options, setOptions] = useState<WalletPaymentOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshWalletPaymentOptions = async () => {
      setOptions(null);
      setIsLoading(true);
      try {
        const newOptions = await trpc.getWalletPaymentOptions.query({
          payerAddress: address,
          usdRequired,
          destChainId,
        });
        setOptions(newOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!address || !usdRequired || !destChainId) return;

    if (address && usdRequired != null && destChainId) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, destChainId]);

  return {
    options,
    isLoading,
  };
}
