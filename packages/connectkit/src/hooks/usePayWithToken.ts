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
    assert(!!daimoPayOrder, "[PAY TOKEN] daimoPayOrder cannot be null");
    assert(!!platform, "[PAY TOKEN] platform cannot be null");

    const { hydratedOrder } = await createOrHydrate({
      order: daimoPayOrder,
      refundAddress: senderAddr,
    });

    log(
      `[CHECKOUT] hydrated order: ${JSON.stringify(
        hydratedOrder,
      )}, checking out with ${tokenAmount.token.token}`,
    );
    setDaimoPayOrder(hydratedOrder);

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
        console.error(`[CHECKOUT] error sending token: ${e}`);
        throw e;
      }
    })();

    if (txHash) {
      await trpc.processSourcePayment.mutate({
        orderId: daimoPayOrder.id.toString(),
        sourceInitiateTxHash: txHash,
        sourceChainId: tokenAmount.token.chainId,
        sourceFulfillerAddr: assertNotNull(
          senderAddr,
          `[PAY TOKEN] senderAddr cannot be null on order ${daimoPayOrder.id}`,
        ),
        sourceToken: tokenAmount.token.token,
        sourceAmount: tokenAmount.amount,
      });
      // TODO: update order immediately, do not wait for polling.
    }
  };

  return { payWithToken };
}
