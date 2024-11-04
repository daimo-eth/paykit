import {
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  PlatformType,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

const DEFAULT_EXTERNAL_PAYMENT_OPTIONS = [
  ExternalPaymentOptions.Coinbase,
  ExternalPaymentOptions.Binance,
  ExternalPaymentOptions.Daimo,
  ExternalPaymentOptions.RampNetwork,
];

export function useExternalPaymentOptions({
  filterIds,
  usdRequired,
  platform,
}: {
  filterIds: string[] | undefined;
  usdRequired: number | undefined;
  platform: PlatformType | undefined;
}) {
  const [options, setOptions] = useState<ExternalPaymentOptionMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refreshExternalPaymentOptions = async (usd: number) => {
      if (!platform) return;

      setLoading(true);
      try {
        const newOptions = await trpc.getExternalPaymentOptions.query({
          usdRequired: usd,
          platform,
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

    if (usdRequired != null) {
      refreshExternalPaymentOptions(usdRequired);
    }
  }, [usdRequired, filterIds, platform]);

  return {
    options,
    loading,
  };
}