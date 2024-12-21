import {
  assert,
  assertNotNull,
  DaimoPayOrder,
  PlatformType,
  SolanaPublicKey,
} from "@daimo/common";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { hexToBytes } from "viem";
import { TrpcClient } from "../utils/trpc";
import { CreateOrHydrateFn } from "./hookTypes";

export function usePayWithSolanaToken({
  trpc,
  daimoPayOrder,
  setDaimoPayOrder,
  createOrHydrate,
  platform,
  log,
}: {
  trpc: TrpcClient;
  daimoPayOrder: DaimoPayOrder | undefined;
  setDaimoPayOrder: (order: DaimoPayOrder) => void;
  createOrHydrate: CreateOrHydrateFn;
  platform: PlatformType | undefined;
  log: (message: string) => void;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const payWithSolanaToken = async (inputToken: SolanaPublicKey) => {
    assert(!!wallet.publicKey, "No wallet connected");
    assert(!!platform && !!daimoPayOrder);

    const orderId = daimoPayOrder.id;
    const { hydratedOrder } = await createOrHydrate({
      order: daimoPayOrder,
    });

    log(
      `[CHECKOUT] Hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with Solana ${inputToken}`,
    );

    const txHash = await (async () => {
      try {
        const serializedTx = await trpc.getSolanaSwapAndBurnTx.query({
          orderId: orderId.toString(),
          userPublicKey: assertNotNull(wallet.publicKey).toString(),
          inputTokenMint: inputToken,
        });
        const tx = VersionedTransaction.deserialize(hexToBytes(serializedTx));
        const txHash = await wallet.sendTransaction(tx, connection);
        return txHash;
      } catch (e) {
        console.error(e);
        setDaimoPayOrder(hydratedOrder);
        throw e;
      } finally {
        setDaimoPayOrder(hydratedOrder);
      }
    })();

    // TOOD: get the actual amount sent from the tx logs.
    // We are currently using a fake amount = 0.
    trpc.processSolanaSourcePayment.mutate({
      orderId: orderId.toString(),
      startIntentTxHash: txHash,
      amount: "0", // TODO: replace.
      token: inputToken,
    });

    return txHash;
  };

  return { payWithSolanaToken };
}
