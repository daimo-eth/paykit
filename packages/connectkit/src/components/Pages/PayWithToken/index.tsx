import React, { useEffect, useState } from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import { ModalContent, ModalH1, PageContent } from "../../Common/Modal/styles";

import { WalletPaymentOption } from "@daimo/common";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ExternalLinkIcon } from "../../../assets/icons";
import useIsMobile from "../../../hooks/useIsMobile";
import {
  WalletConfigProps,
  walletConfigs,
} from "../../../wallets/walletConfigs";
import Button from "../../Common/Button";
import PaymentBreakdown from "../../Common/PaymentBreakdown";
import TokenLogoSpinner from "../../Spinners/TokenLogoSpinner";

enum PayState {
  RequestingPayment = "Requesting Payment",
  SwitchingChain = "Switching Chain",
  RequestCancelled = "Payment Cancelled",
  RequestSuccessful = "Payment Successful",
}

const PayWithToken: React.FC = () => {
  const isMobile = useIsMobile();
  const { triggerResize, paymentState, setRoute, log } = usePayContext();
  const { selectedTokenOption, payWithToken } = paymentState;
  const [payState, setPayState] = useState<PayState>(
    PayState.RequestingPayment,
  );

  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { connector } = useAccount();

  const [wcWallet, setWcWallet] = useState<WalletConfigProps>();
  useEffect(() => {
    connector?.getProvider()?.then((p: any) => {
      let name = p.session?.peer?.metadata?.name;
      if (p.isCoinbaseWallet) name = "Coinbase Wallet";
      if (name == null) name = "Unknown";
      const wallet = Object.values(walletConfigs).find(
        (c) => name.includes(c.name) || name.includes(c.shortName),
      );
      log(`[SELECT_METHOD] wcWallet: ${name} > ${wallet?.name}`);
      setWcWallet(wallet);
    });
  }, [connector]);

  const trySwitchingChain = async (
    option: WalletPaymentOption,
    forceSwitch: boolean = false,
  ): Promise<boolean> => {
    if (walletChainId !== option.required.token.chainId || forceSwitch) {
      const resultChain = await (async () => {
        try {
          return await switchChainAsync({
            chainId: option.required.token.chainId,
          });
        } catch (e) {
          console.error("Failed to switch chain", e);
          return null;
        }
      })();

      if (resultChain?.id !== option.required.token.chainId) {
        return false;
      }
    }

    return true;
  };

  const handleTransfer = async (option: WalletPaymentOption) => {
    // Switch chain if necessary
    setPayState(PayState.SwitchingChain);
    const switchChain = await trySwitchingChain(option);

    if (!switchChain) {
      console.error("Switching chain failed");
      setPayState(PayState.RequestCancelled);
      return;
    }

    setPayState(PayState.RequestingPayment);
    try {
      await payWithToken(option);
      if (isMobile) {
        if (wcWallet) {
          window.open(wcWallet.getWalletConnectDeeplink?.(""), "_blank");
        }
      }
      setPayState(PayState.RequestSuccessful);
      setTimeout(() => {
        setRoute(ROUTES.CONFIRMATION, { event: "wait-pay-with-token" });
      }, 200);
    } catch (e: any) {
      if (e?.name === "ConnectorChainMismatchError") {
        // Workaround for Rainbow wallet bug -- user is able to switch chain without
        // the wallet updating the chain ID for wagmi.
        log("Chain mismatch detected, attempting to switch and retry");
        const switchSuccessful = await trySwitchingChain(option, true);
        if (switchSuccessful) {
          try {
            await payWithToken(option);
            return; // Payment successful after switching chain
          } catch (retryError) {
            console.error(
              "Failed to pay with token after switching chain",
              retryError,
            );
            throw retryError;
          }
        }
      }
      setPayState(PayState.RequestCancelled);
      console.error("Failed to pay with token", e);
    }
  };

  let transferTimeout: any; // Prevent double-triggering in React dev strict mode.

  useEffect(() => {
    if (!selectedTokenOption) return;

    // Give user time to see the UI before opening
    transferTimeout = setTimeout(() => {
      handleTransfer(selectedTokenOption);
    }, 100);
    return () => {
      clearTimeout(transferTimeout);
    };
  }, []);

  useEffect(() => {
    triggerResize();
  }, [payState]);

  return (
    <PageContent>
      {selectedTokenOption && (
        <TokenLogoSpinner token={selectedTokenOption.required.token} />
      )}
      <ModalContent style={{ paddingBottom: 0 }} $preserveDisplay={true}>
        <ModalH1>{payState}</ModalH1>
        {selectedTokenOption && (
          <PaymentBreakdown paymentOption={selectedTokenOption} />
        )}
        {payState === PayState.RequestingPayment && isMobile && wcWallet && (
          <Button
            icon={<ExternalLinkIcon />}
            onClick={() =>
              window.open(wcWallet.getWalletConnectDeeplink?.(""), "_blank")
            }
          >
            Pay with {wcWallet.name}
          </Button>
        )}
        {payState === PayState.RequestCancelled && (
          <Button
            onClick={() =>
              selectedTokenOption ? handleTransfer(selectedTokenOption) : null
            }
          >
            Retry Payment
          </Button>
        )}
      </ModalContent>
    </PageContent>
  );
};

export default PayWithToken;
