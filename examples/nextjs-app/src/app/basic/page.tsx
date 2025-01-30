"use client";

import { baseUSDC } from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { getAddress } from "viem";
import { Text, TextLink } from "../../shared/tailwind-catalyst/text";
import { APP_ID, Container, DAIMO_ADDRESS, printEvent } from "../shared";

export default function DemoBasic() {
  return (
    <Container>
      <Text>
        This demo shows how you can accept a basic payment from any coin on any
        chain. The recipient receives USDC on Base.
      </Text>
      <div />
      <DaimoPayButton
        appId={APP_ID}
        toChain={baseUSDC.chainId}
        toAddress={DAIMO_ADDRESS}
        toUnits="0.12" /* $0.12 USDC */
        toToken={getAddress(baseUSDC.token)}
        onPaymentStarted={printEvent}
        onPaymentCompleted={printEvent}
      />
      <Text>
        <TextLink
          href="https://github.com/daimo-eth/paykit/blob/main/examples/nextjs-app/src/app/basic"
          target="_blank"
        >
          View on Github ↗
        </TextLink>
      </Text>
    </Container>
  );
}
