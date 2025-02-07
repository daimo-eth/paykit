import {
  assert,
  assertNotNull,
  DaimoPayOrder,
  DaimoPayTokenAmount,
  DepositAddressPaymentOptionData,
  DepositAddressPaymentOptionMetadata,
  DepositAddressPaymentOptions,
  ExternalPaymentOptionMetadata,
  ExternalPaymentOptions,
  PlatformType,
  readDaimoPayOrderID,
  SolanaPublicKey,
  WalletBalanceOption,
  WalletPaymentOption,
} from "@daimo/common";
import { ethereum } from "@daimo/contract";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { Address, formatUnits, Hex, parseUnits } from "viem";
import { useAccount, useEnsName } from "wagmi";

import { DaimoPayModalOptions, PaymentOption } from "../types";
import { generatePayId } from "../utils/exports";
import { detectPlatform } from "../utils/platform";
import { TrpcClient } from "../utils/trpc";
import { useDepositAddressOptions } from "./useDepositAddressOptions";
import { useExternalPaymentOptions } from "./useExternalPaymentOptions";
import { usePayWithSolanaToken } from "./usePayWithSolanaToken";
import { usePayWithToken } from "./usePayWithToken";
import { useSolanaBalanceOptions } from "./useSolanaBalanceOptions";
import { useSolanaPaymentOptions } from "./useSolanaPaymentOptions";
import { useWalletBalanceOptions } from "./useWalletBalanceOptions";
import { useWalletPaymentOptions } from "./useWalletPaymentOptions";

/** Wallet payment details, sent to processSourcePayment after submitting tx. */
export type SourcePayment = Parameters<
  TrpcClient["processSourcePayment"]["mutate"]
>[0];

/** Payment parameters. The payment is created only after user taps pay. */
export interface PayParams {
  /** App ID, for authentication. */
  appId: string;
  /** Destination chain ID. */
  toChain: number;
  /** The destination token to send. */
  toToken: Address;
  /** The amount of the token to send. */
  toUnits: string;
  /** The final address to transfer to or contract to call. */
  toAddress: Address;
  /** Calldata for final call, or empty data for transfer. */
  toCallData?: Hex;
  /** Let the user edit the amount to send. */
  isAmountEditable: boolean;
  /** The intent verb, such as Pay, Deposit, or Purchase. Default: Pay */
  intent?: string;
  /** Payment options. By default, all are enabled. */
  paymentOptions?: PaymentOption[];
  /** Preferred chain IDs. */
  preferredChains?: number[];
  /** Preferred tokens. These appear first in the token list. */
  preferredTokens?: { chain: number; address: Address }[];
}

/** Creates (or loads) a payment and manages the corresponding modal. */
export interface PaymentState {
  setPayId: (id: string | undefined) => void;
  setPayParams: (payParams: PayParams | undefined) => void;
  payParams: PayParams | undefined;
  generatePreviewOrder: (payParams: PayParams) => void;

  daimoPayOrder: DaimoPayOrder | undefined;
  isDepositFlow: boolean;
  modalOptions: DaimoPayModalOptions;
  setModalOptions: (modalOptions: DaimoPayModalOptions) => void;
  paymentWaitingMessage: string | undefined;
  externalPaymentOptions: ReturnType<typeof useExternalPaymentOptions>;
  walletPaymentOptions: ReturnType<typeof useWalletPaymentOptions>;
  walletBalanceOptions: ReturnType<typeof useWalletBalanceOptions>;
  solanaPaymentOptions: ReturnType<typeof useSolanaPaymentOptions>;
  solanaBalanceOptions: ReturnType<typeof useSolanaBalanceOptions>;
  depositAddressOptions: ReturnType<typeof useDepositAddressOptions>;
  selectedExternalOption: ExternalPaymentOptionMetadata | undefined;
  selectedTokenOption: WalletPaymentOption | undefined;
  selectedTokenBalance: WalletBalanceOption | undefined;
  selectedSolanaTokenOption: WalletPaymentOption | undefined;
  selectedSolanaTokenBalance: WalletBalanceOption | undefined;
  selectedDepositAddressOption: DepositAddressPaymentOptionMetadata | undefined;
  setPaymentWaitingMessage: (message: string | undefined) => void;
  setSelectedExternalOption: (
    option: ExternalPaymentOptionMetadata | undefined,
  ) => void;
  setSelectedTokenOption: (option: WalletPaymentOption | undefined) => void;
  setSelectedTokenBalance: (option: WalletBalanceOption | undefined) => void;
  setSelectedSolanaTokenOption: (
    option: WalletPaymentOption | undefined,
  ) => void;
  setSelectedSolanaTokenBalance: (
    option: WalletBalanceOption | undefined,
  ) => void;
  setSelectedDepositAddressOption: (
    option: DepositAddressPaymentOptionMetadata | undefined,
  ) => void;
  setChosenUsd: (usd: number) => void;
  payWithToken: (tokenAmount: DaimoPayTokenAmount) => Promise<void>;
  payWithExternal: (option: ExternalPaymentOptions) => Promise<string>;
  payWithDepositAddress: (
    option: DepositAddressPaymentOptions,
  ) => Promise<DepositAddressPaymentOptionData | null>;
  payWithSolanaToken: (
    inputToken: SolanaPublicKey,
  ) => Promise<string | undefined>;
  refreshOrder: () => Promise<void>;
  onSuccess: (args: { txHash: string; txURL?: string }) => void;
  senderEnsName: string | undefined;
}

export function usePaymentState({
  trpc,
  daimoPayOrder,
  setDaimoPayOrder,
  setOpen,
  log,
}: {
  trpc: TrpcClient;
  daimoPayOrder: DaimoPayOrder | undefined;
  setDaimoPayOrder: (o: DaimoPayOrder) => void;
  setOpen: (showModal: boolean) => void;
  log: (...args: any[]) => void;
}): PaymentState {
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

  // Solana wallet state.
  const solanaWallet = useWallet();
  const solanaPubKey = solanaWallet.publicKey?.toBase58();

  // Daimo Pay order state.
  const [payParams, setPayParamsState] = useState<PayParams>();
  const [paymentWaitingMessage, setPaymentWaitingMessage] = useState<string>();
  const [isDepositFlow, setIsDepositFlow] = useState<boolean>(false);

  // Payment UI config.
  const [modalOptions, setModalOptions] = useState<DaimoPayModalOptions>({});

  // UI state. Selection for external payment (Binance, etc) vs wallet payment.
  const externalPaymentOptions = useExternalPaymentOptions({
    trpc,
    filterIds: daimoPayOrder?.metadata.payer?.paymentOptions,
    platform,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    mode: daimoPayOrder?.mode,
  });
  const walletPaymentOptions = useWalletPaymentOptions({
    trpc,
    address: senderAddr,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    destChainId: daimoPayOrder?.destFinalCallTokenAmount.token.chainId,
    preferredChains: daimoPayOrder?.metadata.payer?.preferredChains,
    preferredTokens: daimoPayOrder?.metadata.payer?.preferredTokens,
    isDepositFlow,
    log,
  });
  const walletBalanceOptions = useWalletBalanceOptions({
    trpc,
    address: senderAddr,
    destChainId: daimoPayOrder?.destFinalCallTokenAmount.token.chainId,
    preferredChains: daimoPayOrder?.metadata.payer?.preferredChains,
    preferredTokens: daimoPayOrder?.metadata.payer?.preferredTokens,
    isDepositFlow,
    log,
  });
  const solanaPaymentOptions = useSolanaPaymentOptions({
    trpc,
    address: solanaPubKey,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    isDepositFlow,
  });
  const solanaBalanceOptions = useSolanaBalanceOptions({
    trpc,
    address: solanaPubKey,
    isDepositFlow,
  });
  const depositAddressOptions = useDepositAddressOptions({
    trpc,
    usdRequired: daimoPayOrder?.destFinalCallTokenAmount.usd,
    mode: daimoPayOrder?.mode,
  });

  /** Create a new order or hydrate an existing one. */
  const createOrHydrate = async ({
    order,
    refundAddress,
    externalPaymentOption,
  }: {
    order: DaimoPayOrder;
    refundAddress?: string;
    externalPaymentOption?: ExternalPaymentOptions;
  }) => {
    assert(!!platform, "missing platform");

    if (payParams == null) {
      log(`[CHECKOUT] hydrating existing order ${order.id}`);
      return await trpc.hydrateOrder.query({
        id: order.id.toString(),
        chosenFinalTokenAmount: order.destFinalCallTokenAmount.amount,
        platform,
        refundAddress,
        externalPaymentOption,
      });
    }

    log(`[CHECKOUT] creating+hydrating new order ${order.id}`);
    // Update units, if amountEditable the user may have changed the amount.
    const toUnits = formatUnits(
      BigInt(order.destFinalCallTokenAmount.amount),
      order.destFinalCallTokenAmount.token.decimals,
    );
    return await trpc.createOrder.mutate({
      appId: payParams.appId,
      paymentInput: {
        ...payParams,
        id: order.id.toString(),
        toUnits: toUnits,
        metadata: order.metadata,
      },
      platform,
      refundAddress,
      externalPaymentOption,
    });
  };

  const { payWithToken } = usePayWithToken({
    trpc,
    senderAddr,
    daimoPayOrder,
    setDaimoPayOrder,
    createOrHydrate,
    platform,
    log,
  });

  const { payWithSolanaToken } = usePayWithSolanaToken({
    trpc,
    daimoPayOrder,
    setDaimoPayOrder,
    createOrHydrate,
    platform,
    log,
  });

  const [selectedExternalOption, setSelectedExternalOption] =
    useState<ExternalPaymentOptionMetadata>();

  const [selectedTokenOption, setSelectedTokenOption] =
    useState<WalletPaymentOption>();
  const [selectedTokenBalance, setSelectedTokenBalance] =
    useState<WalletBalanceOption>();

  const [selectedSolanaTokenOption, setSelectedSolanaTokenOption] =
    useState<WalletPaymentOption>();
  const [selectedSolanaTokenBalance, setSelectedSolanaTokenBalance] =
    useState<WalletBalanceOption>();

  const [selectedDepositAddressOption, setSelectedDepositAddressOption] =
    useState<DepositAddressPaymentOptionMetadata>();

  const payWithExternal = async (option: ExternalPaymentOptions) => {
    assert(!!daimoPayOrder && !!platform);
    const { hydratedOrder, externalPaymentOptionData } = await createOrHydrate({
      order: daimoPayOrder,
      externalPaymentOption: option,
    });
    assert(!!externalPaymentOptionData, "missing externalPaymentOptionData");

    log(
      `[CHECKOUT] Hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with external payment: ${option}`,
    );

    setPaymentWaitingMessage(externalPaymentOptionData.waitingMessage);
    setDaimoPayOrder(hydratedOrder);

    return externalPaymentOptionData.url;
  };

  const payWithDepositAddress = async (
    option: DepositAddressPaymentOptions,
  ) => {
    assert(!!daimoPayOrder);
    const { hydratedOrder } = await createOrHydrate({
      order: daimoPayOrder,
    });
    setDaimoPayOrder(hydratedOrder);

    log(
      `[CHECKOUT] Hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with deposit address: ${option}`,
    );

    const depositAddressOption = await trpc.getDepositAddressOptionData.query({
      input: option,
      usdRequired: daimoPayOrder.destFinalCallTokenAmount.usd,
      toAddress: assertNotNull(hydratedOrder.intentAddr),
    });
    return depositAddressOption;
  };

  const refreshOrder = useCallback(async () => {
    const id = daimoPayOrder?.id?.toString();
    if (!id) return;

    const { order } = await trpc.getOrder.query({
      id,
    });

    // Don't overwrite the order if a new order was generated.
    if (daimoPayOrder == null || order.id === daimoPayOrder.id) {
      setDaimoPayOrder(order);
    }
  }, [daimoPayOrder?.id]);

  /** User picked a different deposit amount. */
  const setChosenUsd = (usd: number) => {
    log(`[CHECKOUT] Setting chosen USD amount to ${usd}`);
    assert(!!daimoPayOrder);
    const token = daimoPayOrder.destFinalCallTokenAmount.token;
    const tokenAmount = parseUnits(
      (usd / token.usd).toString(),
      token.decimals,
    );

    // TODO: remove amount from destFinalCall, it is redundant with
    // destFinalCallTokenAmount. Here, we only modify one and not the other.
    setDaimoPayOrder({
      ...daimoPayOrder,
      destFinalCallTokenAmount: {
        token,
        amount: tokenAmount.toString() as `${bigint}`,
        usd: usd,
      },
    });
  };

  const setPayId = useCallback(
    async (payId: string | undefined) => {
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
      log(`[CHECKOUT] fetched order: ${JSON.stringify(order)}`);

      setDaimoPayOrder(order);
    },
    [daimoPayOrder],
  );

  /** Called whenever params change. */
  const setPayParams = async (payParams: PayParams | undefined) => {
    assert(payParams != null);
    setPayParamsState(payParams);
    setIsDepositFlow(payParams.isAmountEditable);

    generatePreviewOrder(payParams);
  };

  const generatePreviewOrder = async (payParams: PayParams) => {
    const newPayId = generatePayId();
    const newId = readDaimoPayOrderID(newPayId).toString();
    // Set dummy value for deposit flow, since user can edit the amount.
    const toUnits = payParams.isAmountEditable ? "0" : payParams.toUnits;

    const orderPreview = await trpc.previewOrder.query({
      id: newId,
      toChain: payParams.toChain,
      toToken: payParams.toToken,
      toUnits,
      toAddress: payParams.toAddress,
      toCallData: payParams.toCallData,
      isAmountEditable: payParams.isAmountEditable,
      metadata: {
        intent: payParams.intent ?? "Pay",
        items: [],
        payer: {
          paymentOptions: payParams.paymentOptions,
          preferredChains: payParams.preferredChains,
          preferredTokens: payParams.preferredTokens,
        },
      },
    });

    setDaimoPayOrder(orderPreview);
  };

  const onSuccess = ({ txHash, txURL }: { txHash: string; txURL?: string }) => {
    if (modalOptions?.closeOnSuccess) {
      log(`[CHECKOUT] transaction succeeded, closing: ${txHash} ${txURL}`);
      setTimeout(() => setOpen(false), 1000);
    }
  };

  return {
    setPayId,
    payParams,
    setPayParams,
    generatePreviewOrder,
    daimoPayOrder,
    isDepositFlow,
    modalOptions,
    setModalOptions,
    paymentWaitingMessage,
    selectedExternalOption,
    selectedTokenOption,
    selectedTokenBalance,
    selectedSolanaTokenOption,
    selectedSolanaTokenBalance,
    externalPaymentOptions,
    walletPaymentOptions,
    walletBalanceOptions,
    solanaPaymentOptions,
    solanaBalanceOptions,
    depositAddressOptions,
    selectedDepositAddressOption,
    setPaymentWaitingMessage,
    setSelectedExternalOption,
    setSelectedTokenOption,
    setSelectedTokenBalance,
    setSelectedSolanaTokenOption,
    setSelectedSolanaTokenBalance,
    setSelectedDepositAddressOption,
    setChosenUsd,
    payWithToken,
    payWithExternal,
    payWithDepositAddress,
    payWithSolanaToken,
    refreshOrder,
    onSuccess,
    senderEnsName: senderEnsName ?? undefined,
  };
}
