"use client";

import * as foreignTokens from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { Text, TextLink } from "../../shared/tailwind-catalyst/text";
import CodeSnippet from "../code-snippet";
import { ConfigPanel, type DepositConfig } from "../config-panel";
import { APP_ID, Container, printEvent } from "../shared";

export default function DemoDeposit() {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [codeSnippet, setCodeSnippet] = useState("");

  // Generate the code snippet when config changes
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
  toToken={getAddress(${tokenVarName}.token)}
  intent="Deposit"
/>
        `;
        setCodeSnippet(snippet);
      }
    }
  }, [config]);

  return (
    <Container className="max-w-full mx-auto p-6 bg-cream-light shadow-lg rounded-lg">
      <div className="mb-8">
        <Text className="text-lg text-gray-700 mb-4 text-center">
          Onboard users to your app using the tokens they already own on other
          chains. Users can customize their deposit amount.
        </Text>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => setIsConfigOpen(true)}
          className="bg-green-medium text-white px-6 py-3 rounded-lg hover:bg-green-dark transition-all"
        >
          Configure Deposit
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col items-center">
          {config ? (
            <>
              <Text className="text-green-dark font-medium mb-4">
                Your deposit is ready!
              </Text>
              <DaimoPayButton
                appId={APP_ID}
                toChain={config.chainId}
                toAddress={getAddress(config.recipientAddress)}
                toToken={getAddress(config.tokenAddress)}
                intent="Deposit"
                onPaymentStarted={printEvent}
                onPaymentCompleted={(e) => {
                  printEvent(e);
                  setTxHash(e.txHash);
                }}
              />
              {txHash && (
                <div className="mt-4">
                  <TextLink
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    className="inline-flex items-center text-green-medium hover:text-green-dark"
                  >
                    Transaction Successful ↗
                  </TextLink>
                </div>
              )}
            </>
          ) : (
            <Text className="text-center text-gray-600">
              Configure your deposit settings to continue
            </Text>
          )}
        </div>
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
        configType="deposit"
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfirm={(depositConfig) => setConfig(depositConfig as DepositConfig)}
      />
    </Container>
  );
}
