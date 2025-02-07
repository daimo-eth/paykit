"use client";

import { baseUSDC } from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { getAddress } from "viem";
import { Code, Text, TextLink } from "../../shared/tailwind-catalyst/text";
import { APP_ID, Container, DAIMO_ADDRESS, printEvent } from "../shared";

export default function DemoDeposit() {
  return (
    <Container>
      <Text>
        Onboard users to your app using the tokens they already own on other
        chains. Set a default amount and enable <Code>amountEditable</Code> to
        let users customize their deposit amount.
      </Text>
      <div />
      <DaimoPayButton
        appId={APP_ID}
        toChain={baseUSDC.chainId}
        toAddress={DAIMO_ADDRESS}
        toToken={getAddress(baseUSDC.token)}
        intent="Deposit"
        preferredChains={[10]} /* Show assets on Optimism first. */
        onPaymentStarted={printEvent}
        onPaymentCompleted={printEvent}
      />
      <Text>
        <TextLink
          href="https://github.com/daimo-eth/paykit/blob/main/examples/nextjs-app/src/app/deposit"
          target="_blank"
        >
          View on Github ↗
        </TextLink>
      </Text>
    </Container>
  );
}
