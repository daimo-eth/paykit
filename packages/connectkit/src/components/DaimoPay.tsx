import {
  assert,
  DaimoPayIntentStatus,
  DaimoPayOrder,
  DaimoPayOrderMode,
  DaimoPayOrderStatusSource,
  debugJson,
  retryBackoff,
} from "@daimo/common";
import { Buffer } from "buffer";
import React, {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider } from "styled-components";
import { useAccount, WagmiContext } from "wagmi";

import { REQUIRED_CHAINS } from "../defaultConfig";
import { useChainIsSupported } from "../hooks/useChainIsSupported";
import { useChains } from "../hooks/useChains";
import {
  useConnectCallback,
  useConnectCallbackProps,
} from "../hooks/useConnectCallback";
import { useThemeFont } from "../hooks/useGoogleFont";
import { PaymentState, usePaymentState } from "../hooks/usePaymentState";
import defaultTheme from "../styles/defaultTheme";
import {
  CustomTheme,
  DaimoPayContextOptions,
  DaimoPayModalOptions,
  Languages,
  Mode,
  Theme,
} from "../types";
import { createTrpcClient } from "../utils/trpc";
import { DaimoPayModal } from "./DaimoPayModal";
import { SolanaContextProvider, SolanaWalletName } from "./contexts/solana";
import { Web3ContextProvider } from "./contexts/web3";

export enum ROUTES {
  SELECT_METHOD = "daimoPaySelectMethod",
  SELECT_TOKEN = "daimoPaySelectToken",
  SELECT_AMOUNT = "daimoPaySelectAmount",
  SELECT_EXTERNAL_AMOUNT = "daimoPaySelectExternalAmount",
  SELECT_DEPOSIT_ADDRESS_AMOUNT = "daimoPaySelectDepositAddressAmount",
  OTHER_DEVICE = "daimoPayOtherDevice",
  WAITING_EXTERNAL = "daimoPayWaitingExternal",
  SELECT_DEPOSIT_ADDRESS_CHAIN = "daimoPaySelectDepositAddressChain",
  WAITING_DEPOSIT_ADDRESS = "daimoPayWaitingDepositAddress",
  PAY_WITH_TOKEN = "daimoPayPayWithToken",
  CONFIRMATION = "daimoPayConfirmation",
  SOLANA_CONNECT = "daimoPaySolanaConnect",
  SOLANA_CONNECTOR = "daimoPaySolanaConnector",
  SOLANA_SELECT_TOKEN = "daimoPaySolanaSelectToken",
  SOLANA_SELECT_AMOUNT = "daimoPaySolanaSelectAmount",
  SOLANA_PAY_WITH_TOKEN = "daimoPaySolanaPayWithToken",

  // Unused routes. Kept to minimize connectkit merge conflicts.
  ONBOARDING = "onboarding",
  ABOUT = "about",
  CONNECTORS = "connectors",
  MOBILECONNECTORS = "mobileConnectors",
  CONNECT = "connect",
  DOWNLOAD = "download",
  SWITCHNETWORKS = "switchNetworks",
}

/** Chosen Ethereum wallet, eg MM or Rainbow. Specifies wallet ID. */
type Connector = {
  id: string;
};
type Error = string | React.ReactNode | null;

/** Daimo Pay internal context. */
type ContextValue = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  customTheme: CustomTheme | undefined;
  setCustomTheme: React.Dispatch<React.SetStateAction<CustomTheme | undefined>>;
  lang: Languages;
  setLang: React.Dispatch<React.SetStateAction<Languages>>;
  open: boolean;
  setOpen: (open: boolean, meta?: Record<string, any>) => void;
  route: string;
  setRoute: (route: ROUTES, data?: Record<string, any>) => void;
  connector: Connector;
  setConnector: React.Dispatch<React.SetStateAction<Connector>>;
  errorMessage: Error;
  debugMode?: boolean;
  log: (...props: any) => void;
  displayError: (message: string | React.ReactNode | null, code?: any) => void;
  resize: number;
  triggerResize: () => void;

  // All options below are new, specific to Daimo Pay.
  /** Session ID. */
  sessionId: string;
  /** Chosen Solana wallet, eg Phantom.*/
  solanaConnector: SolanaWalletName | undefined;
  setSolanaConnector: React.Dispatch<
    React.SetStateAction<SolanaWalletName | undefined>
  >;
  /** Global options, across all pay buttons and payments. */
  options?: DaimoPayContextOptions;
  /** Loads a payment, then shows the modal to complete payment. */
  showPayment: (modalOptions: DaimoPayModalOptions) => Promise<void>;
  /** Payment status & callbacks. */
  paymentState: PaymentState;
  /** TRPC API client. Internal use only. */
  trpc: any;
  /** Custom message to display on confirmation page. */
  confirmationMessage?: string;
  setConfirmationMessage: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
} & useConnectCallbackProps;

/** Meant for internal use. This will be non-exported in a future SDK version. */
export const Context = createContext<ContextValue | null>(null);

type DaimoPayProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;
  options?: DaimoPayContextOptions;
  debugMode?: boolean;
  /**
   * Be careful with this endpoint, some endpoints (incl. Alchemy) don't support
   * `signatureSubscribe` which leads to txes behaving erratically
   * (ex. successful txes take minutes to confirm instead of seconds)
   */
  solanaRpcUrl?: string;
  /** Custom Pay API, useful for test and staging. */
  payApiUrl?: string;
} & useConnectCallbackProps;

const DaimoPayProviderWithoutSolana = ({
  children,
  theme = "auto",
  mode = "auto",
  customTheme,
  options,
  onConnect,
  onDisconnect,
  debugMode = false,
  payApiUrl = "https://pay-api.daimo.xyz",
}: DaimoPayProviderProps) => {
  // DaimoPayProvider must be within a WagmiProvider
  if (!React.useContext(WagmiContext)) {
    throw Error("DaimoPayProvider must be within a WagmiProvider");
  }

  // Only allow for mounting DaimoPayProvider once, so we avoid weird global
  // state collisions.
  if (React.useContext(Context)) {
    throw new Error(
      "Multiple, nested usages of DaimoPayProvider detected. Please use only one.",
    );
  }

  useConnectCallback({
    onConnect,
    onDisconnect,
  });

  const chains = useChains();

  for (const requiredChain of REQUIRED_CHAINS) {
    if (!chains.some((c) => c.id === requiredChain.id)) {
      throw new Error(
        `Daimo Pay requires chains ${REQUIRED_CHAINS.map((c) => c.name).join(", ")}. Use \`getDefaultConfig\` to automatically configure required chains.`,
      );
    }
  }

  // Default config options
  const defaultOptions: DaimoPayContextOptions = {
    language: "en-US",
    hideBalance: false,
    hideTooltips: false,
    hideQuestionMarkCTA: false,
    hideNoWalletCTA: false,
    walletConnectCTA: "link",
    hideRecentBadge: false,
    avoidLayoutShift: true,
    embedGoogleFonts: false,
    truncateLongENSAddress: true,
    walletConnectName: undefined,
    reducedMotion: false,
    disclaimer: null,
    bufferPolyfill: true,
    customAvatar: undefined,
    initialChainId: undefined,
    enforceSupportedChains: false,
    ethereumOnboardingUrl: undefined,
    walletOnboardingUrl: undefined,
    overlayBlur: undefined,
  };

  const opts: DaimoPayContextOptions = Object.assign(
    {},
    defaultOptions,
    options,
  );

  if (typeof window !== "undefined") {
    // Buffer Polyfill, needed for bundlers that don't provide Node polyfills (e.g CRA, Vite, etc.)
    if (opts.bufferPolyfill) window.Buffer = window.Buffer ?? Buffer;

    // Some bundlers may need `global` and `process.env` polyfills as well
    // Not implemented here to avoid unexpected behaviors, but leaving example here for future reference
    /*
     * window.global = window.global ?? window;
     * window.process = window.process ?? { env: {} };
     */
  }

  const [ckTheme, setTheme] = useState<Theme>(theme);
  const [ckMode, setMode] = useState<Mode>(mode);
  const [ckCustomTheme, setCustomTheme] = useState<CustomTheme | undefined>(
    customTheme ?? {},
  );
  const [ckLang, setLang] = useState<Languages>("en-US");
  const [open, setOpenState] = useState<boolean>(false);
  const setOpen = (open: boolean, meta?: Record<string, any>) => {
    setOpenState(open);
    trpc.nav.mutate({
      action: open ? "navOpenPay" : "navClosePay",
      orderId: daimoPayOrder?.id?.toString(),
      data: meta ?? {},
    });
  };
  const [connector, setConnector] = useState<ContextValue["connector"]>({
    id: "",
  });
  const [solanaConnector, setSolanaConnector] = useState<
    SolanaWalletName | undefined
  >();
  const [route, setRouteState] = useState<ROUTES>(ROUTES.SELECT_METHOD);
  const setRoute = (route: ROUTES, data?: Record<string, any>) => {
    assert(route.startsWith("daimoPay"), () => `Invalid route: ${route}`);
    const action = route.replace("daimoPay", "nav");
    trpc.nav.mutate({
      action,
      orderId: daimoPayOrder?.id?.toString(),
      data: data ?? {},
    });
    setRouteState(route);
  };
  const [errorMessage, setErrorMessage] = useState<Error>("");
  const [confirmationMessage, setConfirmationMessage] = useState<
    string | undefined
  >(undefined);

  const [resize, onResize] = useState<number>(0);

  // Include Google Font that is needed for a themes
  if (opts.embedGoogleFonts) useThemeFont(theme);

  // Other Configuration
  useEffect(() => setTheme(theme), [theme]);
  useEffect(() => setLang(opts.language || "en-US"), [opts.language]);
  useEffect(() => setErrorMessage(null), [route, open]);

  // Check if chain is supported, elsewise redirect to switches page
  const { chain, isConnected } = useAccount();
  const isChainSupported = useChainIsSupported(chain?.id);

  useEffect(() => {
    if (isConnected && opts.enforceSupportedChains && !isChainSupported) {
      setOpen(true);
      setRoute(ROUTES.SWITCHNETWORKS);
    }
  }, [isConnected, isChainSupported, chain, route, open]);

  const log = debugMode ? console.log : () => {};

  // Track sessions. Each generates separate intent IDs unless using externalId.
  const [sessionId] = useState(() => crypto.randomUUID().replaceAll("-", ""));

  // Connect to the Daimo Pay TRPC API
  const trpc = useMemo(
    () => createTrpcClient(payApiUrl, sessionId),
    [payApiUrl],
  );

  // PaymentInfo is a second, inner context object containing a DaimoPayOrder
  // plus all associated status and callbacks. In order for useContext() and
  // downstream hooks like useDaimoPayStatus() to work correctly, we must set
  // set refresh context when payment status changes; done via setDaimoPayOrder.
  const [daimoPayOrder, setDaimoPayOrderInner] = useState<DaimoPayOrder>();
  const setDaimoPayOrder = useCallback(
    (order: DaimoPayOrder) => {
      setDaimoPayOrderInner(order);
      let extra = `> $${order.destFinalCallTokenAmount.usd.toFixed(2)} to ${order.destFinalCallTokenAmount.token.chainId} ${order.destFinalCall.to}`;
      if (order.mode === DaimoPayOrderMode.HYDRATED) {
        extra += ` via ${order.intentAddr} ${order.sourceStatus} ${order.intentStatus}`;
      }
      log(`[PAY] setDaimoPayOrder: ${order.id} ${extra}`);
    },
    [setDaimoPayOrderInner],
  );
  const paymentState = usePaymentState({
    trpc,
    daimoPayOrder,
    setDaimoPayOrder,
    setOpen,
    log,
  });

  // When a payment is in progress, poll for status updates. Do this regardless
  // of whether the modal is still being displayed for useDaimoPayStatus().
  useEffect(() => {
    // Order just updated...
    if (daimoPayOrder?.mode !== DaimoPayOrderMode.HYDRATED) return;

    const { intentStatus } = daimoPayOrder;
    let intervalMs = 0;
    if (intentStatus === DaimoPayIntentStatus.UNPAID) {
      intervalMs = 2000; // additional, faster polling in WaitingOther
    } else if (intentStatus === DaimoPayIntentStatus.STARTED) {
      intervalMs = 300; // poll fast from payment started to payment completed
    } else {
      return;
    }

    log(`[PAY] polling in ${intervalMs}ms`);
    const timeout = setTimeout(
      () => retryBackoff("refreshOrder", () => paymentState.refreshOrder()),
      intervalMs,
    );

    return () => clearTimeout(timeout);
  }, [daimoPayOrder]);

  const showPayment = async (modalOptions: DaimoPayModalOptions) => {
    const { daimoPayOrder } = paymentState;
    const id = daimoPayOrder?.id;
    log(`[PAY] showing payment ${debugJson({ id, modalOptions })}`);

    paymentState.setModalOptions(modalOptions);

    setOpen(true);

    if (
      daimoPayOrder &&
      daimoPayOrder.mode === DaimoPayOrderMode.HYDRATED &&
      (daimoPayOrder.sourceStatus !==
        DaimoPayOrderStatusSource.WAITING_PAYMENT ||
        daimoPayOrder.destFastFinishTxHash ||
        daimoPayOrder.destClaimTxHash)
    ) {
      setRoute(ROUTES.CONFIRMATION);
    } else {
      setRoute(ROUTES.SELECT_METHOD);
    }
  };

  const value = {
    theme: ckTheme,
    setTheme,
    mode: ckMode,
    setMode,
    customTheme,
    setCustomTheme,
    lang: ckLang,
    setLang,
    open,
    setOpen,
    route,
    setRoute,
    connector,
    // Daimo Pay context
    sessionId,
    setConnector,
    solanaConnector,
    setSolanaConnector,
    onConnect,
    // Other configuration
    options: opts,
    errorMessage,
    confirmationMessage,
    setConfirmationMessage,
    debugMode,
    log,
    displayError: (message: string | React.ReactNode | null, code?: any) => {
      setErrorMessage(message);
      console.log("---------DAIMOPAY DEBUG---------");
      console.log(message);
      if (code) console.table(code);
      console.log("---------/DAIMOPAY DEBUG---------");
    },
    resize,
    triggerResize: () => onResize((prev) => prev + 1),

    // Above: generic ConnectKit context
    // Below: Daimo Pay context
    showPayment,
    paymentState,
    trpc,
  };

  return createElement(
    Context.Provider,
    { value },
    <Web3ContextProvider enabled={open}>
      <ThemeProvider theme={defaultTheme}>
        {children}
        <DaimoPayModal
          lang={ckLang}
          theme={ckTheme}
          mode={mode}
          customTheme={ckCustomTheme}
        />
      </ThemeProvider>
    </Web3ContextProvider>,
  );
};

/**
 * Provides context for DaimoPayButton and hooks. Place in app root or layout.
 */
export const DaimoPayProvider = (props: DaimoPayProviderProps) => {
  return (
    <SolanaContextProvider solanaRpcUrl={props.solanaRpcUrl}>
      <DaimoPayProviderWithoutSolana {...props} />
    </SolanaContextProvider>
  );
};

/** Daimo Pay internal context. */
export const usePayContext = () => {
  const context = React.useContext(Context);
  if (!context) throw Error("DaimoPay Hook must be inside a Provider.");
  return context;
};
