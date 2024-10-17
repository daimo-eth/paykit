export { default as getDefaultConfig } from "./defaultConfig";
export { default as getDefaultConnectors } from "./defaultConnectors";
export * as Types from "./types";
export { wallets } from "./wallets";

export { Context, DaimoPayProvider } from "./components/DaimoPay";
export { DaimoPayButton } from "./components/DaimoPayButton";
export { useModal } from "./hooks/useModal";

export { default as Avatar } from "./components/Common/Avatar";
export { default as ChainIcon } from "./components/Common/Chain";

// Hooks
export { useChainIsSupported } from "./hooks/useChainIsSupported";
export { useChains } from "./hooks/useChains";
export { useDaimoPayStatus } from "./hooks/useDaimoPayStatus";
export { default as useIsMounted } from "./hooks/useIsMounted"; // Useful for apps that use SSR

