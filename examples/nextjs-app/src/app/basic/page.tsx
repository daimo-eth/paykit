"use client";

import * as foreignTokens from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { Text } from "../../shared/tailwind-catalyst/text";
import CodeSnippet from "../code-snippet";
import { ConfigPanel, type PaymentConfig } from "../config-panel";
import { APP_ID, Container, printEvent } from "../shared";

export default function DemoBasic() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [codeSnippet, setCodeSnippet] = useState("");

  useEffect(() => {
    if (config) {
      const token = Object.values(foreignTokens).find(
        (t) =>
          typeof t === "object" &&
          t !== null &&
          "token" in t &&
          t.token === config.tokenAddress,
      );

      if (token && typeof token === "object" && "symbol" in token) {
        const tokenVarName =
          Object.entries(foreignTokens).find(
            ([_, value]) =>
              typeof value === "object" &&
              value !== null &&
              "token" in value &&
              value.token === config.tokenAddress,
          )?.[0] || token.symbol;

        const snippet = `
import { ${tokenVarName} } from "@daimo/contract";

<DaimoPayButton
  appId="${APP_ID}"
  toChain={${tokenVarName}.chainId}
  toAddress={getAddress("${config.recipientAddress}")}
  toUnits={"${config.amount}"}
  toToken={getAddress(${tokenVarName}.token)}
/>
        `;
        setCodeSnippet(snippet);
      }
    }
  }, [config]);

  return (
    <Container className="max-w-4xl mx-auto p-6 bg-cream-light shadow-lg rounded-lg">
      <Text className="text-lg text-gray-700 mb-4 text-center">
        This demo shows how you can accept a basic payment from any coin on any
        chain. Configure the recipient to make a payment to yourself.
      </Text>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => setIsConfigOpen(true)}
          className="bg-green-medium text-white px-6 py-3 rounded-lg hover:bg-green-dark transition-all"
        >
          Set Up Payment
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        {config ? (
          <div className="flex flex-col items-center">
            <Text className="text-green-dark font-medium mb-4">
              Your payment is ready!
            </Text>
            <DaimoPayButton
              appId={APP_ID}
              toChain={config.chainId}
              toAddress={getAddress(config.recipientAddress)}
              toUnits={config.amount}
              toToken={getAddress(config.tokenAddress)}
              onPaymentStarted={printEvent}
              onPaymentCompleted={printEvent}
            />
          </div>
        ) : (
          <Text className="text-center text-gray-600">
            Configure your payment details to continue
          </Text>
        )}
      </div>

      {config && (
        <div className="mb-6">
          <Text className="text-lg font-medium text-green-dark mb-2">
            Implementation Code
          </Text>
          <CodeSnippet codeSnippet={codeSnippet} />
        </div>
      )}

      <ConfigPanel
        configType="payment"
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfirm={(paymentConfig) => setConfig(paymentConfig as PaymentConfig)}
      />
    </Container>
  );
}
