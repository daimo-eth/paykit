import { DaimoPayToken } from "@daimo/common";
import { AnimatePresence } from "framer-motion";
import { chainToLogo } from "../../../assets/chains";
import CircleSpinner from "../CircleSpinner";
import { AnimationContainer, LoadingContainer } from "../styles";
import { ChainLogoContainer } from "./styles";

const TokenLogoSpinner = ({ token }: { token: DaimoPayToken }) => {
  return (
    <LoadingContainer>
      <AnimationContainer $circle={true}>
        <AnimatePresence>
          {chainToLogo[token.chainId] && (
            <ChainLogoContainer key="ChainLogoContainer">
              {chainToLogo[token.chainId]}
            </ChainLogoContainer>
          )}
          <CircleSpinner
            key="CircleSpinner"
            logo={
              <img src={token.logoURI} alt={token.symbol} key={token.logoURI} />
            }
            loading={true}
            unavailable={false}
          />
        </AnimatePresence>
      </AnimationContainer>
    </LoadingContainer>
  );
};

export default TokenLogoSpinner;
