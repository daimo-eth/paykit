import {
  assert,
  assertNotNull,
  DaimoPayOrder,
  DaimoPayTokenAmount,
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  PlatformType,
  readDaimoPayOrderID,
} from "@daimo/common";
import { erc20Abi, ethereum } from "@daimo/contract";
import { useCallback, useEffect, useState } from "react";
import { parseUnits, zeroAddress } from "viem";
import {
  useAccount,
  useEnsName,
  useSendTransaction,
  useWriteContract,
} from "wagmi";

import { DaimoPayModalOptions } from "../types";
import { detectPlatform } from "../utils/platform";
import { trpc } from "../utils/trpc";
import { useExternalPaymentOptions } from "./useExternalPaymentOptions";
import {
  useWalletPaymentOptions,
  WalletPaymentOption,
} from "./useWalletPaymentOptions";

/** Wallet payment details, sent to processSourcePayment after submitting tx. */
export type SourcePayment = Parameters<
  typeof trpc.processSourcePayment.mutate
>[0];

/** Loads a DaimoPayOrder + manages the corresponding modal. */
export interface PaymentInfo {
  setPayId: (id: string | null) => Promise<void>;
  daimoPayOrder: DaimoPayOrder | undefined;
  modalOptions: DaimoPayModalOptions;
  setModalOptions: (modalOptions: DaimoPayModalOptions) => void;
  paymentWaitingMessage: string | undefined;
  externalPaymentOptions: ReturnType<typeof useExternalPaymentOptions>;
  walletPaymentOptions: ReturnType<typeof useWalletPaymentOptions>;
  selectedExternalOption: ExternalPaymentOptionMetadata | undefined;
  selectedTokenOption: WalletPaymentOption | undefined;
  setSelectedExternalOption: (
    option: ExternalPaymentOptionMetadata | undefined,
  ) => void;
  setSelectedTokenOption: (option: WalletPaymentOption | undefined) => void;
  setChosenUsd: (amount: number) => void;
  payWithToken: (tokenAmount: DaimoPayTokenAmount) => Promise<void>;
  payWithExternal: (option: ExternalPaymentOptions) => Promise<string>;
  refreshOrder: () => Promise<void>;
  onSuccess: (args: { txHash: string; txURL?: string }) => void;
  senderEnsName: string | undefined;
}

export function usePaymentInfo({
  daimoPayOrder,
  setDaimoPayOrder,
  setOpen,
  log,
}: {
  daimoPayOrder: DaimoPayOrder | undefined;
  setDaimoPayOrder: (o: DaimoPayOrder) => void;
  setOpen: (showModal: boolean) => void;
  log: (...args: any[]) => void;
}): PaymentInfo {
  // Browser state.
  const [platform, setPlatform] = useState<PlatformType>();
  useEffect(() => {
    setPlatform(detectPlatform(window.navigator.userAgent));
  }, []);

  // Wallet state.
  const { address: senderAddr } = useAccount();
  const { data: senderEnsName } = useEnsName({
    chainId: ethereum.chainId,
    address: senderAddr,
  });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  // Daimo Pay order state.
  const [paymentWaitingMessage, setPaymentWaitingMessage] = useState<string>();

  // Payment UI config.
  const [modalOptions, setModalOptions] = useState<DaimoPayModalOptions>({});

  // UI state. Selection for external payment (Binance, etc) vs wallet payment.
  const externalPaymentOptions = useExternalPaymentOptions({
    filterIds: daimoPayOrder?.metadata.payer?.paymentOptions,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    platform,
  });
  const walletPaymentOptions = useWalletPaymentOptions({
    address: senderAddr,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    destChainId: daimoPayOrder?.destFinalCallTokenAmount.token.chainId,
  });

  const [selectedExternalOption, setSelectedExternalOption] =
    useState<ExternalPaymentOptionMetadata>();

  const [selectedTokenOption, setSelectedTokenOption] =
    useState<WalletPaymentOption>();

  const payWithToken = async (tokenAmount: DaimoPayTokenAmount) => {
    assert(!!daimoPayOrder && !!platform);
    const { hydratedOrder } = await trpc.hydrateOrder.query({
      id: daimoPayOrder.id.toString(),
      chosenFinalTokenAmount: daimoPayOrder.destFinalCallTokenAmount.amount,
      platform,
      refundAddress: senderAddr,
    });

    log(
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
    assert(!!daimoPayOrder && !!platform);
    const { hydratedOrder, externalPaymentOptionData } =
      await trpc.hydrateOrder.query({
        id: daimoPayOrder.id.toString(),
        externalPaymentOption: option,
        chosenFinalTokenAmount: daimoPayOrder.destFinalCallTokenAmount.amount,
        platform,
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

  /** User picked a different deposit amount. */
  const setChosenUsd = (usdAmount: number) => {
    log(`[CHECKOUT] Setting chosen USD amount to ${usdAmount}`);
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

      log(`[CHECKOUT] Parsed order: ${JSON.stringify(order)}`);

      setDaimoPayOrder(order);
    },
    [daimoPayOrder],
  );

  const onSuccess = ({ txHash, txURL }: { txHash: string; txURL?: string }) => {
    if (modalOptions?.closeOnSuccess) {
      log(`[CHECKOUT] transaction succeeded, closing: ${txHash} ${txURL}`);
      setTimeout(() => setOpen(false), 1000);
    }
  };

  return {
    setPayId,
    daimoPayOrder,
    modalOptions,
    setModalOptions,
    paymentWaitingMessage,
    selectedExternalOption,
    selectedTokenOption,
    externalPaymentOptions,
    walletPaymentOptions,
    setSelectedExternalOption,
    setSelectedTokenOption,
    setChosenUsd,
    payWithToken,
    payWithExternal,
    refreshOrder,
    onSuccess,
    senderEnsName: senderEnsName ?? undefined,
  };
}
