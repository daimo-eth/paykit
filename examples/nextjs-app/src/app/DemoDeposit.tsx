"use client";

import { baseUSDC } from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { getAddress } from "viem";
import { Code, Text, TextLink } from "../shared/tailwind-catalyst/text";
import { APP_ID, Container, printEvent } from "./shared";

export function DemoDeposit() {
  return (
    <Container>
      <Text>
        Onboard users in one click. For any-chain deposits, set an initial
        amount and use <Code>amountEditable</Code> to let the user choose.
      </Text>
      <div />
      <DaimoPayButton
        appId={APP_ID}
        toChain={8453}
        toAddress="0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D"
        toUnits="10.00" /* $10.00 USDC */
        toToken={getAddress(baseUSDC.token)}
        intent="Deposit"
        amountEditable
        preferredChains={[10]} /* Show assets on Optimism first. */
        onPaymentStarted={printEvent}
        onPaymentCompleted={printEvent}
      />
      <Text>
        <TextLink
          href="https://github.com/daimo-eth/paykit/blob/main/examples/nextjs-app/src/app/DemoDeposit.tsx"
          target="_blank"
        >
          View on Github ↗
        </TextLink>
      </Text>
    </Container>
  );
}
