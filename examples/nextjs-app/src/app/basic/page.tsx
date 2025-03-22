"use client";

import * as foreignTokens from "@daimo/contract";
import { DaimoPayButton } from "@daimo/pay";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { Text } from "../../shared/tailwind-catalyst/text";
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
          <StyledCodeBlock codeSnippet={codeSnippet} />
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

function StyledCodeBlock({ codeSnippet }: { codeSnippet: string }) {
  const highlightCode = (line: string) => {
    if (line.trim().startsWith("import")) {
      const importMatch = line.match(/\{\s*([^}]+)\s*\}/);
      const pathMatch = line.match(/"([^"]+)"/);
      return (
        <span>
          <span className="text-purple-400">import</span>
          <span className="text-white"> {"{" + " "}</span>
          <span className="text-yellow-300">
            {importMatch ? importMatch[1] : ""}
          </span>
          <span className="text-white">{" " + "}"} </span>
          <span className="text-purple-400">from</span>
          <span className="text-green-400">
            {" "}
            &quot;{pathMatch ? pathMatch[1] : ""}&quot;
          </span>
          <span className="text-white">;</span>
        </span>
      );
    }
    if (line.includes("<DaimoPayButton")) {
      return <span className="text-purple-400">{line}</span>;
    }
    if (line.includes("appId=")) {
      const valueMatch = line.match(/=([^,]+)/);
      return (
        <span>
          <span className="text-cyan-300">appId</span>
          <span className="text-white">=</span>
          <span className="text-green-400">
            {valueMatch ? valueMatch[1] : ""}
          </span>
        </span>
      );
    }
    if (line.includes("toChain=")) {
      const valueMatch = line.match(/=([^,]+)/);
      return (
        <span>
          <span className="text-cyan-300">toChain</span>
          <span className="text-white">=</span>
          <span className="text-orange-400">
            {valueMatch ? valueMatch[1] : ""}
          </span>
        </span>
      );
    }
    if (line.includes("toAddress=")) {
      const valueMatch = line.match(/=([^,]+)/);
      return (
        <span>
          <span className="text-cyan-300">toAddress</span>
          <span className="text-white">=</span>
          <span className="text-orange-400">
            {valueMatch ? valueMatch[1] : ""}
          </span>
        </span>
      );
    }
    if (line.includes("toUnits=")) {
      const valueMatch = line.match(/=([^,]+)/);
      return (
        <span>
          <span className="text-cyan-300">toUnits</span>
          <span className="text-white">=</span>
          <span className="text-green-400">
            {valueMatch ? valueMatch[1] : ""}
          </span>
        </span>
      );
    }
    if (line.includes("toToken=")) {
      const valueMatch = line.match(/=([^,]+)/);
      return (
        <span>
          <span className="text-cyan-300">toToken</span>
          <span className="text-white">=</span>
          <span className="text-orange-400">
            {valueMatch ? valueMatch[1] : ""}
          </span>
        </span>
      );
    }
    if (line.includes("getAddress")) {
      return (
        <span>
          <span className="text-yellow-300">getAddress</span>
          <span className="text-white">{line.replace("getAddress", "")}</span>
        </span>
      );
    }
    return <span className="text-white">{line}</span>;
  };

  return (
    <div className="bg-[#1e1e1e] rounded-lg px-6 py-4 text-white overflow-x-auto scrollbar-none mt-4 max-w-full border border-gray-700">
      <pre className="font-mono text-sm md:text-base">
        <code>
          {codeSnippet.split("\n").map((line, index) => (
            <div key={index} className="flex group">
              <span className="text-gray-500 w-8 text-right pr-3 select-none group-hover:text-gray-400">
                {index + 1}
              </span>
              <span className="ml-4 flex-1">{highlightCode(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
