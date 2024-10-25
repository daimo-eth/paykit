import React, { useEffect } from "react";
import { useAccount, useEnsName } from "wagmi";
import useIsMounted from "../../hooks/useIsMounted";
import { truncateEthAddress } from "./../../utils";

import { useContext } from "../DaimoPay";
import { TextContainer } from "./styles";

import { AnimatePresence, Variants } from "framer-motion";
import { Chain } from "viem";
import { useChainIsSupported } from "../../hooks/useChainIsSupported";
import { ResetContainer } from "../../styles";
import { CustomTheme, Mode, Theme } from "../../types";
import ThemedButton, { ThemeContainer } from "../Common/ThemedButton";

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

type Hash = `0x${string}`;

type DaimoPayButtonRendererProps = {
  /** The payment ID, generated via the Daimo Pay API. */
  payId: string;
  /** Automatically close the modal after a successful payment. */
  closeOnSuccess?: boolean;
  /** Custom renderer */
  children?: (renderProps: {
    show?: () => void;
    hide?: () => void;
    chain?: Chain & {
      unsupported?: boolean;
    };
    unsupported: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    address?: Hash;
    truncatedAddress?: string;
    ensName?: string;
    payId?: string;
  }) => React.ReactNode;
};

const DaimoPayButtonRenderer: React.FC<DaimoPayButtonRendererProps> = ({
  payId,
  closeOnSuccess,
  children,
}) => {
  const isMounted = useIsMounted();
  const context = useContext();

  const { address, chain } = useAccount();
  const isChainSupported = useChainIsSupported(chain?.id);

  const { data: ensName } = useEnsName({
    chainId: 1,
    address: address,
  });

  // Pre-load payment info in background.
  const { setPayId } = context.paymentInfo;
  useEffect(() => {
    setPayId(payId);
  }, [payId]);

  const hide = () => context.setOpen(false);

  const modalOptions = { closeOnSuccess };
  const show = () => context.loadAndShowPayment(payId, modalOptions);

  if (!children) return null;
  if (!isMounted) return null;

  return (
    <>
      {children({
        payId,
        show,
        hide,
        chain: chain,
        unsupported: !isChainSupported,
        isConnected: !!address,
        isConnecting: context.open,
        address: address,
        truncatedAddress: address ? truncateEthAddress(address) : undefined,
        ensName: ensName?.toString(),
      })}
    </>
  );
};

DaimoPayButtonRenderer.displayName = "DaimoPayButton.Custom";

function DaimoPayButtonInner() {
  const { paymentInfo } = useContext();
  const label = paymentInfo?.daimoPayOrder?.metadata?.intent ?? "Pay";

  return (
    <AnimatePresence initial={false}>
      <TextContainer
        key="connectWalletText"
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

type DaimoPayButtonProps = {
  /** The payment ID, generated via the Daimo Pay API. */
  payId: string;
  /** Light mode, dark mode, or auto. */
  mode?: Mode;
  /** Named theme. See docs for options. */
  theme?: Theme;
  /** Custom theme. See docs for options. */
  customTheme?: CustomTheme;
  /** Automatically close the modal after a successful payment. */
  closeOnSuccess?: boolean;
  /** Get notified when the user clicks, opening the payment modal. */
  onClick?: (open: () => void) => void;
};

export function DaimoPayButton({
  payId,
  theme,
  mode,
  customTheme,
  closeOnSuccess,
  onClick,
}: DaimoPayButtonProps) {
  const isMounted = useIsMounted();

  const context = useContext();

  // Pre-load payment info in background.
  const { setPayId } = context.paymentInfo;
  useEffect(() => {
    setPayId(payId);
  }, [payId]);

  const modalOptions = { closeOnSuccess };
  const show = () => context.loadAndShowPayment(payId, modalOptions);

  if (!isMounted) return null;

  return (
    <ResetContainer
      $useTheme={theme ?? context.theme}
      $useMode={mode ?? context.mode}
      $customTheme={customTheme ?? context.customTheme}
    >
      <ThemeContainer
        onClick={() => {
          if (onClick) {
            onClick(show);
          } else {
            show();
          }
        }}
      >
        <ThemedButton
          theme={theme ?? context.theme}
          mode={mode ?? context.mode}
          customTheme={customTheme ?? context.customTheme}
        >
          <DaimoPayButtonInner />
        </ThemedButton>
      </ThemeContainer>
    </ResetContainer>
  );
}

DaimoPayButton.Custom = DaimoPayButtonRenderer;
