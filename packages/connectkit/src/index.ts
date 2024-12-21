export type * as Types from "./types";

// Configure Daimo Pay
export { DaimoPayProvider } from "./components/DaimoPay";
export { default as getDefaultConfig } from "./defaultConfig";

// Pay button
export { DaimoPayButton } from "./components/DaimoPayButton";

// Hooks to track payment status + UI status.
export { useDaimoPayStatus } from "./hooks/useDaimoPayStatus";

/** TODO: replace with useDaimoPay() */
export { useModal } from "./hooks/useModal";

// These first two just return configured wagmi chains = not necessarily
// supported by Daimo Pay.
// export { useChainIsSupported } from "./hooks/useChainIsSupported";
// export { useChains } from "./hooks/useChains";
// export { default as useIsMounted } from "./hooks/useIsMounted";

// For convenience, export components to show connected account.
export { default as Avatar } from "./components/Common/Avatar";
export { default as ChainIcon } from "./components/Common/Chain";
export { wallets } from "./wallets";

// Export utilities.
export * from "./utils/exports";
