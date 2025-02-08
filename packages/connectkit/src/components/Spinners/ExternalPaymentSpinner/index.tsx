import { AnimatePresence } from "framer-motion";
import CircleSpinner from "../CircleSpinner";
import SquircleSpinner from "../SquircleSpinner";
import { AnimationContainer, LoadingContainer } from "../styles";

const ExternalPaymentSpinner = ({
  logoURI,
  logoShape,
  showSpinner = true,
}: {
  logoURI: string;
  logoShape: "circle" | "squircle";
  showSpinner?: boolean;
}) => {
  const optionSpinner = (() => {
    if (logoShape === "circle") {
      return (
        <CircleSpinner
          logo={<img src={logoURI} />}
          loading={showSpinner}
          unavailable={false}
        />
      );
    } else {
      return (
        <SquircleSpinner logo={<img src={logoURI} />} loading={showSpinner} />
      );
    }
  })();

  return (
    <LoadingContainer>
      <AnimationContainer $circle={logoShape === "circle"}>
        <AnimatePresence>{optionSpinner}</AnimatePresence>
      </AnimationContainer>
    </LoadingContainer>
  );
};

export default ExternalPaymentSpinner;
