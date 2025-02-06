import { motion } from "framer-motion";
import {
  Arbitrum,
  Base,
  Ethereum,
  Optimism,
  Polygon,
  Solana,
} from "../../../assets/chains";
import { USDC } from "../../../assets/coins";
import defaultTheme from "../../../constants/defaultTheme";
import styled from "../../../styles/styled";
import { formatUsd } from "../../../utils/format";
import { ROUTES, usePayContext } from "../../DaimoPay";
import { ModalH1 } from "../Modal/styles";

/** Shows payment amount. */
export const OrderHeader = ({ minified = false }: { minified?: boolean }) => {
  const { paymentState, route } = usePayContext();

  const orderUsd = paymentState.daimoPayOrder?.destFinalCallTokenAmount.usd;

  const titleAmountContent = (() => {
    if (paymentState.isDepositFlow && route === ROUTES.SELECT_TOKEN) {
      return <ModalH1>Your balances</ModalH1>;
    }

    return <>{orderUsd != null && <span>{formatUsd(orderUsd)}</span>}</>;
  })();

  if (minified) {
    return (
      <MinifiedContainer>
        <MinifiedTitleAmount>{titleAmountContent}</MinifiedTitleAmount>
        <CoinLogos $size={32} />
      </MinifiedContainer>
    );
  } else {
    return (
      <>
        {!paymentState.isDepositFlow && (
          <TitleAmount>{titleAmountContent}</TitleAmount>
        )}

        <AnyChainAnyCoinContainer>
          <CoinLogos />
          <Subtitle>1000+ tokens accepted</Subtitle>
        </AnyChainAnyCoinContainer>
      </>
    );
  }
};

function CoinLogos({ $size = 24 }: { $size?: number }) {
  const logos = [
    <Ethereum />,
    <USDC />,
    <Optimism />,
    <Arbitrum />,
    <Base />,
    <Polygon />,
    <Solana />,
  ];

  const logoBlock = (element: React.ReactElement, index: number) => (
    <LogoContainer
      key={index}
      $marginLeft={index !== 0 ? -($size / 3) : 0}
      $zIndex={logos.length - index}
      $size={$size}
      transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 0.98] }}
    >
      {element}
    </LogoContainer>
  );

  return (
    <Logos>{logos.map((element, index) => logoBlock(element, index))}</Logos>
  );
}

const TitleAmount = styled(motion.h1)<{
  $error?: boolean;
  $valid?: boolean;
}>`
  margin-bottom: 24px;
  padding: 0;
  line-height: 66px;
  font-size: 64px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  color: ${(props) => {
    if (props.$error) return "var(--ck-body-color-danger)";
    if (props.$valid) return "var(--ck-body-color-valid)";
    return "var(--ck-body-color)";
  }};
  @media only screen and (max-width: ${defaultTheme.mobileWidth}px) {
    font-size: 64px;
  }
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Subtitle = styled(motion.div)`
  font-size: 18px;
  font-weight: 500;
  line-height: 21px;
  color: var(--ck-body-color-muted);
`;

const MinifiedTitleAmount = styled(motion.div)`
  font-size: 32px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  line-height: 36px;
  color: var(--ck-body-color);
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 8px;
`;

const MinifiedContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 24px;
`;

const AnyChainAnyCoinContainer = styled(motion.div)`
  display: flex;
  vertical-align: middle;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const LogoContainer = styled(motion.div)<{
  $marginLeft?: number;
  $zIndex?: number;
  $size: number;
}>`
  display: block;
  overflow: hidden;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${(props) => props.$marginLeft || 0}px;
  z-index: ${(props) => props.$zIndex || 2};
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 9999px;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`;

const Logos = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
