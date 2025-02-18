import React, { useEffect } from "react";

import { usePayContext } from "../DaimoPay";
import { TextContainer } from "./styles";

import {
  assertNotNull,
  DaimoPayIntentStatus,
  DaimoPayOrderMode,
  DaimoPayUserMetadata,
  getDaimoPayOrderView,
  PaymentBouncedEvent,
  PaymentCompletedEvent,
  PaymentStartedEvent,
  writeDaimoPayOrderID,
} from "@daimo/common";
import { AnimatePresence, Variants } from "framer-motion";
import { Address, Hex } from "viem";
import { PayParams } from "../../hooks/usePaymentState";
import { ResetContainer } from "../../styles";
import { CustomTheme, Mode, PaymentOption, Theme } from "../../types";
import ThemedButton, { ThemeContainer } from "../Common/ThemedButton";

type PayButtonPaymentProps =
  | {
      /**
       * Your public app ID. Specify either (payId) or (appId + parameters).
       */
      appId: string;
      /**
       * Destination chain ID.
       */
      toChain: number;
      /**
       * The destination token to send, completing payment. Must be an ERC-20
       * token or the zero address, indicating the native token / ETH.
       */
      toToken: Address;
      /**
       * The amount of destination token to send (transfer or approve).
       * If not provided, the user will be prompted to enter an amount.
       */
      toUnits?: string;
      /**
       * The destination address to transfer to, or contract to call.
       */
      toAddress: Address;
      /**
       * Optional calldata to call an arbitrary function on `toAddress`.
       */
      toCallData?: Hex;
      /**
       * The intent verb, such as "Pay", "Deposit", or "Purchase".
       */
      intent?: string;
      /**
       * Payment options. By default, all are enabled.
       */
      paymentOptions?: PaymentOption[];
      /**
       * Preferred chain IDs. Assets on these chains will appear first.
       */
      preferredChains?: number[];
      /**
       * Preferred tokens. These appear first in the token list.
       */
      preferredTokens?: { chain: number; address: Address }[];
      /**
       * External ID. E.g. a correlation ID.
       */
      externalId?: string;
      /**
       * Developer metadata. E.g. correlation ID.
       * */
      metadata?: DaimoPayUserMetadata;
    }
  | {
      /** The payment ID, generated via the Daimo Pay API. Replaces params above. */
      payId: string;
    };

type PayButtonCommonProps = PayButtonPaymentProps & {
  /** Called when user sends payment and transaction is seen on chain */
  onPaymentStarted?: (event: PaymentStartedEvent) => void;
  /** Called when destination transfer or call completes successfully */
  onPaymentCompleted?: (event: PaymentCompletedEvent) => void;
  /** Called when destination call reverts and funds are refunded */
  onPaymentBounced?: (event: PaymentBouncedEvent) => void;
  /** Automatically close the modal after a successful payment. */
  closeOnSuccess?: boolean;
  /** Open the modal by default. */
  defaultOpen?: boolean;
  /** Custom message to display on confirmation page. */
  confirmationMessage?: string;
};

type DaimoPayButtonProps = PayButtonCommonProps & {
  /** Light mode, dark mode, or auto. */
  mode?: Mode;
  /** Named theme. See docs for options. */
  theme?: Theme;
  /** Custom theme. See docs for options. */
  customTheme?: CustomTheme;
  /** Disable interaction. */
  disabled?: boolean;
};

type DaimoPayButtonCustomProps = PayButtonCommonProps & {
  /** Custom renderer */
  children: (renderProps: {
    show: () => void;
    hide: () => void;
  }) => React.ReactNode;
};

/**
 * A button that shows the Daimo Pay checkout. Replaces the traditional
 * Connect Wallet » approve » execute sequence with a single action.
 */
export function DaimoPayButton(props: DaimoPayButtonProps) {
  const { theme, mode, customTheme } = props;
  const context = usePayContext();

  return (
    <DaimoPayButtonCustom {...props}>
      {({ show }) => (
        <ResetContainer
          $useTheme={theme ?? context.theme}
          $useMode={mode ?? context.mode}
          $customTheme={customTheme ?? context.customTheme}
        >
          <ThemeContainer onClick={!props.disabled && show}>
            <ThemedButton
              theme={theme ?? context.theme}
              mode={mode ?? context.mode}
              customTheme={customTheme ?? context.customTheme}
            >
              <DaimoPayButtonInner disabled={props.disabled} />
            </ThemedButton>
          </ThemeContainer>
        </ResetContainer>
      )}
    </DaimoPayButtonCustom>
  );
}

/** Like DaimoPayButton, but with custom styling. */
function DaimoPayButtonCustom(props: DaimoPayButtonCustomProps) {
  const context = usePayContext();

  // Pre-load payment info in background.
  // Reload when any of the info changes.
  let payParams: PayParams | null =
    "appId" in props
      ? {
          appId: props.appId,
          toChain: props.toChain,
          toAddress: props.toAddress,
          toToken: props.toToken,
          toUnits: props.toUnits,
          toCallData: props.toCallData,
          intent: props.intent,
          paymentOptions: props.paymentOptions,
          preferredChains: props.preferredChains,
          preferredTokens: props.preferredTokens,
          externalId: props.externalId,
          metadata: props.metadata,
        }
      : null;
  let payId = "payId" in props ? props.payId : null;

  const { paymentState } = context;
  useEffect(() => {
    if (payId != null) {
      paymentState.setPayId(payId);
    } else if (payParams != null) {
      paymentState.setPayParams(payParams);
    }
  }, [payId, ...Object.values(payParams || {})]);

  const { setConfirmationMessage } = context;
  useEffect(() => {
    if (props.confirmationMessage) {
      setConfirmationMessage(props.confirmationMessage);
    }
  }, [props.confirmationMessage, setConfirmationMessage]);

  // Payment events: call these three event handlers.
  const { onPaymentStarted, onPaymentCompleted, onPaymentBounced } = props;

  const order = paymentState.daimoPayOrder;
  const intentStatus = order?.intentStatus;
  const hydOrder = order?.mode === DaimoPayOrderMode.HYDRATED ? order : null;

  // Functions to show and hide the modal
  const { children, closeOnSuccess } = props;
  const modalOptions = { closeOnSuccess };
  const show = () => {
    if (paymentState.daimoPayOrder == null) return;
    context.showPayment(modalOptions);
  };
  const hide = () => context.setOpen(false);

  // Emit event handlers when payment status changes
  useEffect(() => {
    if (hydOrder == null) return;
    if (intentStatus === DaimoPayIntentStatus.UNPAID) return;

    if (intentStatus === DaimoPayIntentStatus.STARTED) {
      onPaymentStarted?.({
        type: DaimoPayIntentStatus.STARTED,
        paymentId: writeDaimoPayOrderID(hydOrder.id),
        chainId: hydOrder.destFinalCallTokenAmount.token.chainId,
        txHash: assertNotNull(
          hydOrder.sourceInitiateTxHash,
          `[PAY BUTTON] source initiate tx hash null on order ${hydOrder.id} when intent status is ${intentStatus}`,
        ),
        payment: getDaimoPayOrderView(hydOrder),
      });
    } else if (
      intentStatus === DaimoPayIntentStatus.COMPLETED ||
      intentStatus === DaimoPayIntentStatus.BOUNCED
    ) {
      const event = {
        type: intentStatus,
        paymentId: writeDaimoPayOrderID(hydOrder.id),
        chainId: hydOrder.destFinalCallTokenAmount.token.chainId,
        txHash: assertNotNull(
          hydOrder.destFastFinishTxHash ?? hydOrder.destClaimTxHash,
          `[PAY BUTTON] dest tx hash null on order ${hydOrder.id} when intent status is ${intentStatus}`,
        ),
        payment: getDaimoPayOrderView(hydOrder),
      };

      if (intentStatus === DaimoPayIntentStatus.COMPLETED) {
        onPaymentCompleted?.(event as PaymentCompletedEvent);
      } else if (intentStatus === DaimoPayIntentStatus.BOUNCED) {
        onPaymentBounced?.(event as PaymentBouncedEvent);
      }
    }
  }, [hydOrder?.id, intentStatus]);

  useEffect(() => {
    if (props.defaultOpen) {
      show();
    }
  }, [order != null]);

  // Validation
  if ((payId == null) == (payParams == null)) {
    throw new Error("Must specify either payId or appId, not both");
  }

  return children({ show, hide });
}

DaimoPayButtonCustom.displayName = "DaimoPayButton.Custom";

DaimoPayButton.Custom = DaimoPayButtonCustom;

const contentVariants: Variants = {
  initial: {
    zIndex: 2,
    opacity: 0,
    x: "-100%",
  },
  animate: {
    opacity: 1,
    x: 0.1,
    transition: {
      duration: 0.4,
      ease: [0.25, 1, 0.5, 1],
    },
  },
  exit: {
    zIndex: 1,
    opacity: 0,
    x: "-100%",
    pointerEvents: "none",
    position: "absolute",
    transition: {
      duration: 0.4,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

function DaimoPayButtonInner({ disabled }: { disabled?: boolean }) {
  const { paymentState } = usePayContext();
  const label = paymentState?.daimoPayOrder?.metadata?.intent ?? "Pay";

  return (
    <AnimatePresence initial={false}>
      <TextContainer
        initial={"initial"}
        animate={"animate"}
        exit={"exit"}
        variants={contentVariants}
        style={{
          height: 40,
        }}
      >
        {label}
      </TextContainer>
    </AnimatePresence>
  );
}
