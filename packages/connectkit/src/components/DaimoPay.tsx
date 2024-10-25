import { Buffer } from "buffer";
import React, {
  createContext,
  createElement,
  ReactNode,
  useEffect,
  useState,
} from "react";
import {
  CustomAvatarProps,
  CustomTheme,
  Languages,
  Mode,
  Theme,
} from "../types";

import defaultTheme from "../styles/defaultTheme";

import { DaimoPayOrderMode } from "@daimo/common";
import { ThemeProvider } from "styled-components";
import { useAccount, WagmiContext } from "wagmi";
import { REQUIRED_CHAINS } from "../defaultConfig";
import { useChainIsSupported } from "../hooks/useChainIsSupported";
import { useChains } from "../hooks/useChains";
import {
  useConnectCallback,
  useConnectCallbackProps,
} from "../hooks/useConnectCallback";
import { useConnector } from "../hooks/useConnectors";
import { useThemeFont } from "../hooks/useGoogleFont";
import { getPaymentInfo, PaymentInfo } from "../utils/getPaymentInfo";
import { isFamily } from "../utils/wallets";
import { DaimoPayModal } from "./DaimoPayModal";
import { Web3ContextProvider } from "./contexts/web3";

export enum ROUTES {
  SELECT_METHOD = "daimoPaySelectMethod",
  SELECT_TOKEN = "daimoPaySelectToken",
  WAITING_OTHER = "daimoPayWaitingOther",
  PAY_WITH_TOKEN = "daimoPayPayWithToken",
  CONFIRMATION = "daimoPayConfirmation",

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
  errorMessage: Error;
  debugMode?: boolean;
  log: (...props: any) => void;
  displayError: (message: string | React.ReactNode | null, code?: any) => void;
  resize: number;
  triggerResize: () => void;
  /** Payment UX options. */
  options?: DaimoPayOptions;
  /** Updates paymentInfo, loading the latest status for a given payment. */
  loadPayment: (payId: string) => Promise<void>;
  /** Payment status & callbacks. */
  paymentInfo: PaymentInfo;
} & useConnectCallbackProps;

export const Context = createContext<ContextValue | null>(null);

export type DaimoPayOptions = {
  language?: Languages;
  hideBalance?: boolean;
  hideTooltips?: boolean;
  hideQuestionMarkCTA?: boolean;
  hideNoWalletCTA?: boolean;
  hideRecentBadge?: boolean;
  walletConnectCTA?: "link" | "modal" | "both";
  /** Avoids layout shift when the DaimoPay modal is open by adding padding to the body */
  avoidLayoutShift?: boolean;
  /** Automatically embeds Google Font of the current theme. Does not work with custom themes */
  embedGoogleFonts?: boolean;
  truncateLongENSAddress?: boolean;
  walletConnectName?: string;
  reducedMotion?: boolean;
  disclaimer?: ReactNode | string;
  bufferPolyfill?: boolean;
  customAvatar?: React.FC<CustomAvatarProps>;
  initialChainId?: number;
  enforceSupportedChains?: boolean;
  ethereumOnboardingUrl?: string;
  walletOnboardingUrl?: string;
  /** Blur the background when the modal is open */
  overlayBlur?: number;
  /** Automatically close the modal on successful payment. */
  closeOnSuccess?: boolean;
};

type DaimoPayProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;
  options?: DaimoPayOptions;
  debugMode?: boolean;
} & useConnectCallbackProps;

export const DaimoPayProvider = ({
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

  const injectedConnector = useConnector("injected");

  // Default config options
  const defaultOptions: DaimoPayOptions = {
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
    closeOnSuccess: undefined,
  };

  const opts: DaimoPayOptions = Object.assign({}, defaultOptions, options);

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

  // Autoconnect to Family wallet if available
  // TODO: Does this work for all injected providers?
  useEffect(() => {
    if (isFamily()) {
      injectedConnector?.connect();
    }
  }, [injectedConnector]);

  const log = debugMode ? console.log : () => {};

  // TODO: PaymentInfo actually includes callbacks and state, too..
  const paymentInfo: PaymentInfo = getPaymentInfo(opts, setOpen, log);

  const loadPayment = async (payId: string) => {
    await paymentInfo.setPayId(payId);
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
    loadPayment,
    connector,
    setConnector,
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

export const useContext = () => {
  const context = React.useContext(Context);
  if (!context) throw Error("DaimoPay Hook must be inside a Provider.");
  return context;
};
