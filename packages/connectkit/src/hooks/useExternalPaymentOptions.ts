import {
  DaimoPayOrderMode,
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  PlatformType,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { TrpcClient } from "../utils/trpc";

const DEFAULT_EXTERNAL_PAYMENT_OPTIONS = [
  ExternalPaymentOptions.Coinbase,
  ExternalPaymentOptions.Binance,
  ExternalPaymentOptions.Daimo,
  ExternalPaymentOptions.RampNetwork,
];

export function useExternalPaymentOptions({
  trpc,
  filterIds,
  platform,
  usdRequired,
  mode,
}: {
  trpc: TrpcClient;
  filterIds: string[] | undefined;
  platform: PlatformType | undefined;
  usdRequired: number | undefined;
  mode: DaimoPayOrderMode | undefined;
}) {
  const [options, setOptions] = useState<ExternalPaymentOptionMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refreshExternalPaymentOptions = async (
      usd: number,
      mode: DaimoPayOrderMode,
    ) => {
      if (!platform) return;

      setLoading(true);
      try {
        const newOptions = await trpc.getExternalPaymentOptions.query({
          platform,
          mode,
          usdRequired: usd,
        });

        // Filter out options not in options JSON
        const enabledExtPaymentOptions =
          filterIds || DEFAULT_EXTERNAL_PAYMENT_OPTIONS;
        const filteredOptions = newOptions.filter((option) =>
          enabledExtPaymentOptions.includes(option.id),
        );

        setOptions(filteredOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (usdRequired != null && mode != null) {
      refreshExternalPaymentOptions(usdRequired, mode);
    }
  }, [usdRequired, filterIds, platform, mode]);

  return {
    options,
    loading,
  };
}
