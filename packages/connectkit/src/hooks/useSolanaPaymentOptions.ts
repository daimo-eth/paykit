import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

export type SolanaPaymentOption = Awaited<
  ReturnType<typeof trpc.getSolanaPaymentOptions.query>
>[0];

export function useSolanaPaymentOptions({
  address,
  usdRequired,
}: {
  address: string | undefined;
  usdRequired: number | undefined;
}) {
  const [options, setOptions] = useState<SolanaPaymentOption[] | null>(null);
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

    if (address && usdRequired != null) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired]);

  return {
    options,
    isLoading,
  };
}
