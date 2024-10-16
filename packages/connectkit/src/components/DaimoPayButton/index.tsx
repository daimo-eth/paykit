import React, { useEffect } from "react";
import { useAccount, useEnsName } from "wagmi";
import useIsMounted from "../../hooks/useIsMounted";
import { truncateEthAddress } from "./../../utils";

import { useModal } from "../../hooks/useModal";
import { useContext } from "../DaimoPay";
import {
  TextContainer
} from "./styles";

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
  payId: string;
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
  children,
}) => {
  const isMounted = useIsMounted();
  const context = useContext();
  const { open, setOpen } = useModal();

  const { address, isConnected, chain } = useAccount();
  const isChainSupported = useChainIsSupported(chain?.id);

  const { data: ensName } = useEnsName({
    chainId: 1,
    address: address,
  });

  function hide() {
    setOpen(false);
  }

  // Pre-load payment info in background.
  const { setPayId } = context.paymentInfo;
  useEffect(() => {
    setPayId(payId);
  }, [payId]);

  async function show() {
    await context.loadPayment(payId); // ensure payment info is loaded before opening.
    context.setOpen(true);
  }

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
        isConnecting: open, // Using `open` to determine if connecting as wagmi isConnecting only is set to true when an active connector is awaiting connection
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
  const label = paymentInfo?.daimoPayOrder?.metadata.intent ?? "Pay";

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
          //padding: '0 5px',
        }}
      >
        {label}
      </TextContainer>
    </AnimatePresence>
  );
}

type DaimoPayButtonProps = {
  // Daimo Pay Order ID.
  payId: string;

  // Theming
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;

  // Events
  onClick?: (open: () => void) => void;
};

export function DaimoPayButton({
  payId,

  // Theming
  theme,
  mode,
  customTheme,

  // Events
  onClick,
}: DaimoPayButtonProps) {
  const isMounted = useIsMounted();

  const context = useContext();

  // Pre-load payment info in background.
  const { setPayId } = context.paymentInfo;
  useEffect(() => {
    setPayId(payId);
  }, [payId]);

  async function show() {
    await context.loadPayment(payId); // ensure payment info is loaded
    context.setOpen(true);
  }

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
