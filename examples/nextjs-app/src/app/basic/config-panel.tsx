"use client";

import * as foreignTokens from "@daimo/contract";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { isAddress } from "viem";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: PaymentConfig) => void;
}

export interface PaymentConfig {
  recipientAddress: string;
  chainId: number;
  tokenAddress: string;
  amount: string;
}

interface ForeignToken {
  chainId: number;
  token: string;
  symbol: string;
  name: string;
  decimals: number;
}

export function ConfigPanel({ isOpen, onClose, onConfirm }: ConfigPanelProps) {
  const [config, setConfig] = useState<PaymentConfig>({
    recipientAddress: "",
    chainId: 0,
    tokenAddress: "",
    amount: "",
  });

  // Chains to exclude
  const excludedChains = new Set([
    11155420, 84532, 80002, 43114, 43113, 501, 11155111, 421614, 1,
  ]);

  // Extract unique chains from foreignTokens
  const chains = Object.entries(foreignTokens)
    .filter(
      ([_, value]): value is ForeignToken =>
        typeof value === "object" &&
        value !== null &&
        "chainId" in value &&
        "token" in value &&
        "symbol" in value,
    )
    .reduce(
      (acc, [_, token]) => {
        // Skip excluded chains
        if (excludedChains.has(token.chainId)) {
          return acc;
        }

        if (!acc.some((chain) => chain.id === token.chainId)) {
          // Add chain name mapping
          const chainNames: Record<number, string> = {
            137: "Polygon",
            56: "BSC",
            42161: "Arbitrum",
            10: "Optimism",
            8453: "Base",
            59144: "Linea",
            480: "Worldchain",
            81457: "Blast",
            5000: "Mantle",
          };

          acc.push({
            id: token.chainId,
            name: chainNames[token.chainId] || `Chain ${token.chainId}`,
          });
        }
        return acc;
      },
      [] as Array<{ id: number; name: string }>,
    );

  // Get tokens for selected chain
  const getTokensForChain = useCallback((chainId: number) => {
    return Object.entries(foreignTokens)
      .filter(
        ([_, value]): value is ForeignToken =>
          typeof value === "object" &&
          value !== null &&
          "chainId" in value &&
          "token" in value &&
          "symbol" in value,
      )
      .map(([_, token]) => token)
      .filter((token) => token.chainId === chainId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(config.recipientAddress)) {
      alert("Please enter a valid address");
      return;
    }
    onConfirm(config);
    onClose();
  };

  return (
    <div
      className={`
      fixed right-0 top-0 h-full w-96 bg-cream-light shadow-lg transform transition-transform
      ${isOpen ? "translate-x-0" : "translate-x-full"}
    `}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-green-dark">
            Payment Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-green-medium hover:text-green-dark"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={config.recipientAddress}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  recipientAddress: e.target.value,
                }))
              }
              className="w-full p-2 border border-gray-300 focus:border-green-medium focus:ring focus:ring-green-light focus:ring-opacity-50 rounded"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receiving Chain
            </label>
            <select
              value={config.chainId}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  chainId: Number(e.target.value),
                  tokenAddress: "", // Reset token when chain changes
                }))
              }
              className="w-full p-2 border border-gray-300 focus:border-green-medium focus:ring focus:ring-green-light focus:ring-opacity-50 rounded"
            >
              <option value={0}>Select Chain</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          {config.chainId > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receiving Token
              </label>
              <select
                value={config.tokenAddress}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    tokenAddress: e.target.value,
                  }))
                }
                className="w-full p-2 border border-gray-300 focus:border-green-medium focus:ring focus:ring-green-light focus:ring-opacity-50 rounded"
              >
                <option value="">Select Token</option>
                {getTokensForChain(config.chainId).map((token) => (
                  <option key={token.token} value={token.token}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={config.amount}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              step="0.01"
              className="w-full p-2 border border-gray-300 focus:border-green-medium focus:ring focus:ring-green-light focus:ring-opacity-50 rounded"
              placeholder="Enter amount..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-medium text-white py-2 px-4 rounded hover:bg-green-dark transition-colors"
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
}
