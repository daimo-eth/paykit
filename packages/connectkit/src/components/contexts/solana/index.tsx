import { WalletName } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

export type SolanaWalletName = WalletName<string>;

export const SolanaContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Be careful with this endpoint, some endpoints (incl. Alchemy) don't support
  // `signatureSubscribe` which leads to txes behaving erratically
  // (ex. successful txes take minutes to confirm instead of seconds)
  const endpoint =
    "https://nameless-thrilling-spring.solana-mainnet.quiknode.pro/71d5c9acbf54c7cf00584cf6fab7fc37e844415f/";

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
