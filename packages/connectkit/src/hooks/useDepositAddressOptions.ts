import { DepositAddressPaymentOptionMetadata } from "@daimo/common";
import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

export function useDepositAddressOptions({
  usdRequired,
}: {
  usdRequired: number;
}) {
  const [options, setOptions] = useState<DepositAddressPaymentOptionMetadata[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refreshDepositAddressOptions = async () => {
      setLoading(true);
      try {
        const options = await trpc.getDepositAddressOptions.query({
          usdRequired,
        });
        setOptions(options);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    refreshDepositAddressOptions();
  }, [usdRequired]);

  return { options, loading };
}
