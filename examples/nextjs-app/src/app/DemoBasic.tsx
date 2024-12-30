"use client";

import { baseUSDC } from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { getAddress } from "viem";
import { Text, TextLink } from "../shared/tailwind-catalyst/text";
import { APP_ID, Container, printEvent } from "./shared";

export function DemoBasic() {
  return (
    <Container>
      <Text>
        This shows a basic payment from any coin on any chain. The recipient
        receives USDC on Base.
      </Text>
      <div />
      <DaimoPayButton
        appId={APP_ID}
        toChain={8453}
        toAddress="0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D"
        toUnits="0.12" /* $0.12 USDC */
        toToken={getAddress(baseUSDC.token)}
        onPaymentStarted={printEvent}
        onPaymentCompleted={printEvent}
      />
      <Text>
        <TextLink
          href="https://github.com/daimo-eth/paykit/blob/main/examples/nextjs-app/src/app/DemoBasic.tsx"
          target="_blank"
        >
          View on Github ↗
        </TextLink>
      </Text>
    </Container>
  );
}
