import {
  assertNotNull,
  BigIntStr,
  DaimoPayOrder,
  PlatformType,
  SolanaPublicKey,
} from "@daimo/common";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { hexToBytes } from "viem";
import { trpc } from "../utils/trpc";

export function usePayWithSolanaToken(
  orderId: bigint | undefined,
  setDaimoPayOrder: (order: DaimoPayOrder) => void,
  chosenFinalTokenAmount: BigIntStr | undefined,
  platform: PlatformType | undefined,
) {
  const { connection } = useConnection();
  const wallet = useWallet();

  const payWithSolanaToken = async (inputToken: SolanaPublicKey) => {
    if (!wallet.publicKey || !orderId || !chosenFinalTokenAmount || !platform) {
      throw new Error("Invalid parameters");
    }

    const { hydratedOrder } = await trpc.hydrateOrder.query({
      id: orderId.toString(),
      chosenFinalTokenAmount,
      platform,
    });

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

    trpc.processSolanaSourcePayment.mutate({
      orderId: orderId.toString(),
      startIntentTxHash: txHash,
      amount: chosenFinalTokenAmount,
      token: inputToken,
    });

    return txHash;
  };

  return { payWithSolanaToken };
}
