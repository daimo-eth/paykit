import { getDAv2Chains } from "@daimo/contract";
import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

/** Wallet payment options. User picks one. */
export type WalletPaymentOption = Awaited<
  ReturnType<TrpcClient["getWalletPaymentOptions"]["query"]>
>[0];

const supportedChainIds = new Set(
  [...getDAv2Chains(false), ...getDAv2Chains(true)].map((c) => c.chainId),
);

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

        // Filter out options we don't support yet.
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

    if (address && usdRequired != null && destChainId) {
      refreshWalletPaymentOptions();
    }
  }, [address, usdRequired, destChainId]);

  return {
    options,
    isLoading,
  };
}
