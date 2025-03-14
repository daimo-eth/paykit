import { motion } from "framer-motion";
import styled from "../../../styles/styled";

const WalletChainLogo = ({
  walletIcon,
  walletName,
  chainLogo,
}: {
  walletIcon: React.ReactNode | string;
  walletName: string;
  chainLogo: React.ReactNode;
}) => {
  const walletIconElement =
    typeof walletIcon === "string" ? (
      <img src={walletIcon} alt={walletName} />
    ) : (
      walletIcon
    );
  return (
    <WalletChainContainer>
      {walletIconElement}
      <ChainContainer>{chainLogo}</ChainContainer>
    </WalletChainContainer>
  );
};

const WalletChainContainer = styled(motion.div)`
  width: 100%;
  height: 100%;
`;
const ChainContainer = styled(motion.div)`
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  overflow: hidden;
  bottom: -4px;
  right: -4px;
`;

export default WalletChainLogo;
