import React, { useState } from "react";
import { All } from "./../../types";

import { AnimatePresence } from "framer-motion";

import { useAccount } from "wagmi";
import useIsMounted from "../../hooks/useIsMounted";

import { motion } from "framer-motion";
import { chainConfigs } from "../../constants/chains";
import Chain from "../Common/Chain";
import ChainSelectDropdown from "../Common/ChainSelectDropdown";
import DynamicContainer from "../Common/DynamicContainer";
import ThemedButton from "../Common/ThemedButton";
import { usePayContext } from "../DaimoPay";
import { DaimoPayThemeProvider } from "../DaimoPayThemeProvider/DaimoPayThemeProvider";
import styled from "./../../styles/styled";

const Container = styled(motion.div)`
  position: relative;
`;

const ArrowIcon = (
  <svg
    width="10"
    height="7"
    viewBox="0 0 10 7"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.292893 0.792893C0.683417 0.402369 1.31658 0.402369 1.70711 0.792893L5 4.08579L8.29289 0.792893C8.68342 0.402369 9.31658 0.402369 9.70711 0.792893C10.0976 1.18342 10.0976 1.81658 9.70711 2.20711L5.70711 6.20711C5.31658 6.59763 4.68342 6.59763 4.29289 6.20711L0.292893 2.20711C-0.0976311 1.81658 -0.0976311 1.18342 0.292893 0.792893Z"
      fill="currentColor"
    />
  </svg>
);

type NetworkButtonProps = {
  hideIcon?: boolean;
  hideName?: boolean;
};

const NetworkButton: React.FC<NetworkButtonProps & All> = ({
  theme,
  mode,
  customTheme,
  hideIcon,
  hideName,
}) => {
  const context = usePayContext();
  const isMounted = useIsMounted();

  const [open, setOpen] = useState(false);

  const { isConnected, chain } = useAccount();

  if (!isMounted) return null;

  const currentChain = chainConfigs.find((c) => c.chainId === chain?.id);
  return (
    <DaimoPayThemeProvider
      theme={theme ?? context.theme}
      mode={mode ?? context.mode}
      customTheme={customTheme ?? context.customTheme}
    >
      <AnimatePresence initial={false}>
        {!(hideIcon && hideName) && (isConnected || chain) && (
          <Container
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "linear" }}
          >
            <ChainSelectDropdown open={open} onClose={() => setOpen(false)}>
              <ThemedButton
                theme={theme}
                mode={mode}
                customTheme={customTheme}
                onClick={() => setOpen(true)}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!hideIcon && (
                    <div>
                      <Chain id={chain?.id} />
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {!hideName && (
                      <div>
                        <DynamicContainer id={`chain-${chain?.id}`}>
                          {currentChain?.name ?? chain?.name}
                        </DynamicContainer>
                      </div>
                    )}
                  </AnimatePresence>
                  <div style={{ minWidth: 10, transform: "translateY(1px)" }}>
                    {ArrowIcon}
                  </div>
                </div>
              </ThemedButton>
            </ChainSelectDropdown>
          </Container>
        )}
      </AnimatePresence>
    </DaimoPayThemeProvider>
  );
};
export default NetworkButton;
