import {
  assert,
  assertNotNull,
  DaimoPayOrder,
  DaimoPayOrderMode,
  DaimoPayTokenAmount,
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  readDaimoPayOrderID,
} from "@daimo/common";
import { erc20Abi } from "@daimo/contract";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { parseUnits, zeroAddress } from "viem";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";

import { trpc } from "./trpc";
import { detectPlatform } from "./platform";

export type SourcePayment = Parameters<
  typeof trpc.processSourcePayment.mutate
>[0];

export type PaymentOption = Awaited<
  ReturnType<typeof trpc.getWalletPaymentOptions.query>
>[0];

export interface PaymentInfo {
  setPayId: (id: string | null) => Promise<void>;
  daimoPayOrder: DaimoPayOrder | null;
  paymentWaitingMessage: string | null;
  selectedExternalOption: ExternalPaymentOptionMetadata | undefined;
  selectedTokenOption: PaymentOption | undefined;
  setSelectedExternalOption: (
    option: ExternalPaymentOptionMetadata | undefined,
  ) => void;
  setSelectedTokenOption: (option: PaymentOption | undefined) => void;
  setChosenUsd: (amount: number) => void;
  payWithToken: (tokenAmount: DaimoPayTokenAmount) => Promise<void>;
  payWithExternal: (option: ExternalPaymentOptions) => Promise<string>;
  refreshOrder: () => Promise<void>;
}

export function getPaymentInfo() {
  // Wallet state.
  const { address: senderAddr } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  // Daimo Pay order state.
  const [daimoPayOrder, setDaimoPayOrder] = useState<DaimoPayOrder | null>(
    null,
  );
  const [paymentWaitingMessage, setPaymentWaitingMessage] = useState<
    string | null
  >(null);

  const [selectedExternalOption, setSelectedExternalOption] =
    useState<ExternalPaymentOptionMetadata>();
  const [selectedTokenOption, setSelectedTokenOption] =
    useState<PaymentOption>();

  const payWithToken = async (tokenAmount: DaimoPayTokenAmount) => {
    assert(!!daimoPayOrder);
    const { hydratedOrder } = await trpc.hydrateOrder.query({
      id: daimoPayOrder.id.toString(),
      chosenFinalTokenAmount: daimoPayOrder.destFinalCallTokenAmount.amount,
      platform: detectPlatform(window.navigator.userAgent),
      refundAddress: senderAddr,
    });

    console.log(
      `[CHECKOUT] Hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with ${tokenAmount.token.token}`,
    );

    const txHash = await (async () => {
      try {
        if (tokenAmount.token.token === zeroAddress) {
          return await sendTransactionAsync({
            to: hydratedOrder.handoffAddr!,
            value: BigInt(tokenAmount.amount),
          });
        } else {
          return await writeContractAsync({
            abi: erc20Abi,
            address: tokenAmount.token.token,
            functionName: "transfer",
            args: [hydratedOrder.handoffAddr!, BigInt(tokenAmount.amount)],
          });
        }
      } catch (e) {
        console.error(`[CHECKOUT] Error sending token: ${e}`);
        setDaimoPayOrder(hydratedOrder);
        throw e;
      } finally {
        setDaimoPayOrder(hydratedOrder);
      }
    })();

    if (txHash) {
      await trpc.processSourcePayment.mutate({
        orderId: daimoPayOrder.id.toString(),
        sourceInitiateTxHash: txHash,
        sourceChainId: tokenAmount.token.chainId,
        sourceFulfillerAddr: assertNotNull(senderAddr),
        sourceToken: tokenAmount.token.token,
        sourceAmount: tokenAmount.amount,
      });
    }
  };

  const payWithExternal = async (option: ExternalPaymentOptions) => {
    assert(!!daimoPayOrder);
    const { hydratedOrder, externalPaymentOptionData } =
      await trpc.hydrateOrder.query({
        id: daimoPayOrder.id.toString(),
        externalPaymentOption: option,
        chosenFinalTokenAmount: daimoPayOrder.destFinalCallTokenAmount.amount,
        platform: detectPlatform(window.navigator.userAgent),
      });

    assert(!!externalPaymentOptionData);
    setPaymentWaitingMessage(externalPaymentOptionData.waitingMessage);
    setDaimoPayOrder(hydratedOrder);

    return externalPaymentOptionData.url;
  };

  const refreshOrder = useCallback(async () => {
    const id = daimoPayOrder?.id?.toString();
    if (!id) return;

    const { order } = await trpc.getOrder.query({
      id,
    });

    setDaimoPayOrder(order);
  }, [daimoPayOrder?.id]);

  const setChosenUsd = (usdAmount: number) => {
    console.log(`[CHECKOUT] Setting chosen USD amount to ${usdAmount}`);
    assert(!!daimoPayOrder);
    const token = daimoPayOrder.destFinalCallTokenAmount.token;
    const tokenAmount = parseUnits(
      (usdAmount / token.usd).toString(),
      token.decimals,
    );

    setDaimoPayOrder({
      ...daimoPayOrder,
      destFinalCallTokenAmount: {
        token,
        amount: tokenAmount.toString() as `${bigint}`,
        usd: usdAmount,
      },
    });
  };

  const setPayId = useCallback(
    async (payId: string | null) => {
      if (!payId) return;
      const id = readDaimoPayOrderID(payId).toString();

      if (daimoPayOrder && BigInt(id) == daimoPayOrder.id) {
        // Already loaded, ignore.
        return;
      }

      const { order } = await trpc.getOrder.query({ id });
      if (!order) {
        console.error(`[CHECKOUT] No order found for ${payId}`);
        return;
      }

      console.log(`[CHECKOUT] Parsed order: ${JSON.stringify(order)}`);

      setDaimoPayOrder(order);
    },
    [daimoPayOrder],
  );

  return {
    setPayId,
    daimoPayOrder,
    paymentWaitingMessage,
    selectedExternalOption,
    selectedTokenOption,
    setSelectedExternalOption,
    setSelectedTokenOption,
    setChosenUsd,
    payWithToken,
    payWithExternal,
    refreshOrder,
  };
}
