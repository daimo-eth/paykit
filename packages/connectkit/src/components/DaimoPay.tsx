import { Buffer } from "buffer";
import React, {
  createContext,
  createElement,
  useEffect,
  useState,
} from "react";
import {
  CustomTheme,
  DaimoPayContextOptions,
  DaimoPayModalOptions,
  Languages,
  Mode,
  Theme,
} from "../types";

import defaultTheme from "../styles/defaultTheme";

import {
  DaimoPayIntentStatus,
  DaimoPayOrder,
  DaimoPayOrderMode,
  DaimoPayOrderStatusSource,
  debugJson,
  retryBackoff,
} from "@daimo/common";
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
import { PaymentInfo, usePaymentInfo } from "../hooks/usePaymentInfo";
import { DaimoPayModal } from "./DaimoPayModal";
import { SolanaContextProvider, SolanaWalletName } from "./contexts/solana";
import { Web3ContextProvider } from "./contexts/web3";

export enum ROUTES {
  SELECT_METHOD = "daimoPaySelectMethod",
  SELECT_TOKEN = "daimoPaySelectToken",
  WAITING_OTHER = "daimoPayWaitingOther",
  WAITING_BITCOIN = "daimoPayWaitingBitcoin",
  PAY_WITH_TOKEN = "daimoPayPayWithToken",
  CONFIRMATION = "daimoPayConfirmation",
  SOLANA_CONNECT = "daimoPaySolanaConnect",
  SOLANA_CONNECTOR = "daimoPaySolanaConnector",
  SOLANA_SELECT_TOKEN = "daimoPaySolanaSelectToken",
  SOLANA_PAY_WITH_TOKEN = "daimoPaySolanaPayWithToken",

  ONBOARDING = "onboarding",
  ABOUT = "about",
  CONNECTORS = "connectors",
  MOBILECONNECTORS = "mobileConnectors",
  CONNECT = "connect",
  DOWNLOAD = "download",
  PROFILE = "profile",
  SWITCHNETWORKS = "switchNetworks",
}

type Connector = {
  id: string;
};
type Error = string | React.ReactNode | null;

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
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  route: string;
  setRoute: React.Dispatch<React.SetStateAction<ROUTES>>;
  connector: Connector;
  setConnector: React.Dispatch<React.SetStateAction<Connector>>;
  solanaConnector: SolanaWalletName | undefined;
  setSolanaConnector: React.Dispatch<
    React.SetStateAction<SolanaWalletName | undefined>
  >;
  errorMessage: Error;
  debugMode?: boolean;
  log: (...props: any) => void;
  displayError: (message: string | React.ReactNode | null, code?: any) => void;
  resize: number;
  triggerResize: () => void;
  /** Global options, across all pay buttons and payments. */
  options?: DaimoPayContextOptions;
  /** Loads a payment, then shows the modal to complete payment. */
  loadAndShowPayment: (
    payId: string,
    modalOptions: DaimoPayModalOptions,
  ) => Promise<void>;
  /** Payment status & callbacks. */
  paymentInfo: PaymentInfo;
} & useConnectCallbackProps;

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
  const [open, setOpen] = useState<boolean>(false);
  const [connector, setConnector] = useState<ContextValue["connector"]>({
    id: "",
  });
  const [solanaConnector, setSolanaConnector] = useState<
    SolanaWalletName | undefined
  >();
  const [route, setRoute] = useState<ROUTES>(ROUTES.SELECT_METHOD);
  const [errorMessage, setErrorMessage] = useState<Error>("");

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

  // PaymentInfo is a second, inner context object containing a DaimoPayOrder
  // plus all associated status and callbacks. In order for useContext() and
  // downstream hooks like useDaimoPayStatus() to work correctly, we must set
  // set refresh context when payment status changes; done via setDaimoPayOrder.
  const [daimoPayOrder, setDaimoPayOrder] = useState<DaimoPayOrder>();
  const paymentInfo = usePaymentInfo({
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

    const { sourceStatus, intentStatus } = daimoPayOrder;
    let intervalMs = 0;
    if (sourceStatus === DaimoPayOrderStatusSource.WAITING_PAYMENT) {
      intervalMs = 2500; // additional, faster polling in WaitingOther
    } else if (intentStatus === DaimoPayIntentStatus.PENDING) {
      intervalMs = 300; // poll fast from (payment initiated) to (finished)
    } else {
      return;
    }

    log(`[PAY] polling in ${intervalMs}ms`);
    setTimeout(
      () => retryBackoff("refreshOrder", () => paymentInfo.refreshOrder()),
      intervalMs,
    );
  }, [daimoPayOrder]);

  const loadAndShowPayment = async (
    payId: string,
    modalOptions: DaimoPayModalOptions,
  ) => {
    log(`[PAY] showing order ${payId}, options ${debugJson(modalOptions)}`);
    await paymentInfo.setPayId(payId);

    paymentInfo.setModalOptions(modalOptions);

    const daimoPayOrder = paymentInfo.daimoPayOrder;
    if (
      daimoPayOrder &&
      daimoPayOrder.mode === DaimoPayOrderMode.HYDRATED &&
      (daimoPayOrder.destFastFinishTxHash || daimoPayOrder.destClaimTxHash)
    ) {
      setRoute(ROUTES.CONFIRMATION);
    } else {
      setRoute(ROUTES.SELECT_METHOD);
    }

    setOpen(true);
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
    setConnector,
    solanaConnector,
    setSolanaConnector,
    onConnect,
    // Other configuration
    options: opts,
    errorMessage,
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
    loadAndShowPayment,
    paymentInfo,
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

export const DaimoPayProvider = (props: DaimoPayProviderProps) => {
  return (
    <SolanaContextProvider solanaRpcUrl={props.solanaRpcUrl}>
      <DaimoPayProviderWithoutSolana {...props} />
    </SolanaContextProvider>
  );
};

export const useContext = () => {
  const context = React.useContext(Context);
  if (!context) throw Error("DaimoPay Hook must be inside a Provider.");
  return context;
};
