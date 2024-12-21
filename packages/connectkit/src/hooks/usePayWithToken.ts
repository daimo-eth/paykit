import {
  assert,
  assertNotNull,
  DaimoPayOrder,
  DaimoPayTokenAmount,
  PlatformType,
} from "@daimo/common";
import { Address, erc20Abi, getAddress, zeroAddress } from "viem";
import { useSendTransaction, useWriteContract } from "wagmi";
import { TrpcClient } from "../utils/trpc";
import { CreateOrHydrateFn } from "./hookTypes";

export function usePayWithToken({
  trpc,
  senderAddr,
  daimoPayOrder,
  setDaimoPayOrder,
  createOrHydrate,
  platform,
  log,
}: {
  trpc: TrpcClient;
  createOrHydrate: CreateOrHydrateFn;
  senderAddr: Address | undefined;
  daimoPayOrder: DaimoPayOrder | undefined;
  setDaimoPayOrder: (order: DaimoPayOrder) => void;
  platform: PlatformType | undefined;
  log: (message: string) => void;
}) {
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  /** Commit to a token + amount = initiate payment. */
  const payWithToken = async (tokenAmount: DaimoPayTokenAmount) => {
    assert(!!daimoPayOrder && !!platform);

    const { hydratedOrder } = await createOrHydrate({
      order: daimoPayOrder,
      refundAddress: senderAddr,
    });

    log(
      `[CHECKOUT] Hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with ${tokenAmount.token.token}`,
    );

    const txHash = await (async () => {
      try {
        if (tokenAmount.token.token === zeroAddress) {
          return await sendTransactionAsync({
            to: hydratedOrder.intentAddr,
            value: BigInt(tokenAmount.amount),
          });
        } else {
          return await writeContractAsync({
            abi: erc20Abi,
            address: getAddress(tokenAmount.token.token),
            functionName: "transfer",
            args: [hydratedOrder.intentAddr, BigInt(tokenAmount.amount)],
          });
        }
      } catch (e) {
        console.error(`[CHECKOUT] Error sending token: ${e}`);
        setDaimoPayOrder(hydratedOrder);
        throw e;
      } finally {
        setDaimoPayOrder(hydratedOrder);
      }
    })();

    if (txHash) {
      await trpc.processSourcePayment.mutate({
        orderId: daimoPayOrder.id.toString(),
        sourceInitiateTxHash: txHash,
        sourceChainId: tokenAmount.token.chainId,
        sourceFulfillerAddr: assertNotNull(senderAddr),
        sourceToken: tokenAmount.token.token,
        sourceAmount: tokenAmount.amount,
      });
    }
  };

  return { payWithToken };
}
