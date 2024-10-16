import React from "react";
import { useContext, ROUTES } from "../../ConnectKit";

import {
  LearnMoreContainer,
  LearnMoreButton,
  InfoBox,
  InfoBoxButtons,
} from "./styles";
import {
  PageContent,
  Disclaimer,
  ModalContent,
  ModalH1,
  ModalBody,
} from "../../Common/Modal/styles";
import WalletIcon from "../../../assets/wallet";

import useLocales from "../../../hooks/useLocales";
import ConnectorList from "../../Common/ConnectorList";
import useIsMobile from "../../../hooks/useIsMobile";
import Button from "../../Common/Button";
import { OrderHeader } from "../../Common/OrderHeader";

const Wallets: React.FC = () => {
  const context = useContext();
  const locales = useLocales({});

  const isMobile = useIsMobile();

  return (
    <PageContent>
      <OrderHeader minified />
      <ConnectorList />

      {isMobile ? (
        <>
          <InfoBox>
            <ModalContent style={{ padding: 0, textAlign: "left" }}>
              <ModalH1 $small>{locales.connectorsScreen_h1}</ModalH1>
              <ModalBody>{locales.connectorsScreen_p}</ModalBody>
            </ModalContent>
            <InfoBoxButtons>
              {!context.options?.hideQuestionMarkCTA && (
                <Button
                  variant={"tertiary"}
                  onClick={() => context.setRoute(ROUTES.ABOUT)}
                >
                  {locales.learnMore}
                </Button>
              )}
              {!context.options?.hideNoWalletCTA && (
                <Button
                  variant={"tertiary"}
                  onClick={() => context.setRoute(ROUTES.ONBOARDING)}
                >
                  {locales.getWallet}
                </Button>
              )}
            </InfoBoxButtons>
          </InfoBox>
        </>
      ) : (
        <>
          {!context.options?.hideNoWalletCTA && (
            <LearnMoreContainer>
              <LearnMoreButton
                onClick={() => context.setRoute(ROUTES.ONBOARDING)}
              >
                <WalletIcon /> {locales.connectorsScreen_newcomer}
              </LearnMoreButton>
            </LearnMoreContainer>
          )}
        </>
      )}
      {context.options?.disclaimer && (
        <Disclaimer style={{ visibility: "hidden", pointerEvents: "none" }}>
          <div>{context.options?.disclaimer}</div>
        </Disclaimer>
      )}
    </PageContent>
  );
};

export default Wallets;
