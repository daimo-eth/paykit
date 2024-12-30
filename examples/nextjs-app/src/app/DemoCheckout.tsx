"use client";

import { getAddressContraction, PaymentStartedEvent } from "@daimo/common";
import { baseUSDC } from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { useCallback, useState } from "react";
import { getAddress } from "viem";
import { Code, Text, TextLink } from "../shared/tailwind-catalyst/text";
import { APP_ID, Columns, Container, printEvent } from "./shared";

export function DemoCheckout() {
  const [payId, setPayId] = useState<string>();

  const start = useCallback((e: PaymentStartedEvent) => {
    printEvent(e);
    const payId = e.paymentId;
    setPayId(payId);
    // Save payId to your backend here. This ensures that you'll be able to
    // correlate all incoming payments even if the user loses network, etc.
    // await saveCartCheckout(payId, ...);
  }, []);

  return (
    <Container>
      <Text>
        For robust checkout, save the payId in <Code>onPaymentStarted</Code>.
        This ensures you&apos;ll be able to correlate incoming payments with a
        cart (or a user ID, form submission, etc) even if the user closes the
        tab.
      </Text>
      <Text>
        In addition to callbacks like <Code>onPaymentSucceeded</Code>, Daimo Pay
        supports{" "}
        <TextLink href="https://paydocs.daimo.com/webhooks">webhooks</TextLink>{" "}
        to track payment status reliably on the backend.
      </Text>
      <div />
      <Columns>
        <div className="flex-1">
          <DaimoPayButton
            appId={APP_ID}
            toChain={8453}
            toAddress="0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D"
            toUnits="0.42" /* $0.42 USDC */
            toToken={getAddress(baseUSDC.token)}
            intent="Purchase"
            preferredChains={[
              8453,
            ]} /* Rank specific chain + coin first in UI. */
            preferredTokens={[
              { chain: 8453, address: getAddress(baseUSDC.token) },
            ]}
            onPaymentStarted={start}
          />
        </div>
        <div className="flex-1">
          <Text>PayID {payId ? getAddressContraction(payId) : "TBD"}</Text>
        </div>
      </Columns>
      <Text>
        <TextLink
          href="https://github.com/daimo-eth/paykit/blob/main/examples/nextjs-app/src/app/DemoCheckout.tsx"
          target="_blank"
        >
          View on Github ↗
        </TextLink>
      </Text>
    </Container>
  );
}
