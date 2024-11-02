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
    if (!address || !usdRequired || !destChainId) return;

    setOptions(null);
    setIsLoading(true);

    trpc.getWalletPaymentOptions
      .query({
        payerAddress: address,
        usdRequired,
        destChainId,
      })
      .then(setOptions)
      .finally(() => setIsLoading(false));
  }, [address, usdRequired, destChainId]);

  return {
    options,
    isLoading,
  };
}
