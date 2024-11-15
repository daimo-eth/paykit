import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  ModalH1,
  PageContent,
} from "../../Common/Modal/styles";

import { getAddressContraction } from "@daimo/common";
import { Bitcoin } from "../../../assets/chains";
import ScanIconWithLogos from "../../../assets/ScanIconWithLogos";
import { trpc } from "../../../utils/trpc";
import Button from "../../Common/Button";
import CopyToClipboard from "../../Common/CopyToClipboard";
import CustomQRCode from "../../Common/CustomQRCode";
import { OrDivider } from "../../Common/Modal";

const WaitingBitcoin: React.FC = () => {
  const { triggerResize, paymentInfo, setRoute } = useContext();
  const { daimoPayOrder, payWithBitcoin } = paymentInfo;

  useEffect(() => {
    const checkForSourcePayment = async () => {
      if (!daimoPayOrder) return;

      const found = await trpc.findSourcePayment.query({
        orderId: daimoPayOrder.id.toString(),
      });

      if (found) {
        setRoute(ROUTES.CONFIRMATION);
      }
    };

    // Check every 10 seconds, bitcoin takes a while
    const interval = setInterval(checkForSourcePayment, 10000);
    return () => clearInterval(interval);
  }, [daimoPayOrder?.id]);

  const [option, setOption] = useState<{
    address: string;
    amount: number;
    uri: string;
  }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    payWithBitcoin().then((option) => {
      if (!option) setFailed(true);
      else setOption(option);
    });
  }, []);

  useEffect(() => {
    triggerResize();
  }, [option]);

  return (
    <PageContent>
      {failed ? (
        <ModalContent style={{ marginLeft: 24, marginRight: 24 }}>
          <ModalH1>Bitcoin unavailable</ModalH1>
          <ModalBody>
            We're unable to process Bitcoin payments at this time. Please select
            another payment method.
          </ModalBody>
          <Button onClick={() => setRoute(ROUTES.SELECT_METHOD)}>
            Select Another Method
          </Button>
        </ModalContent>
      ) : (
        <ModalContent>
          <CustomQRCode
            value={option?.uri}
            image={<Bitcoin />}
            tooltipMessage={
              <>
                <ScanIconWithLogos logo={<Bitcoin />} />
                <span>Use a Bitcoin wallet to scan</span>
              </>
            }
          />
          {option && (
            <>
              <OrDivider />
              <ModalBody>
                Send exactly {option.amount} BTC to{" "}
                {getAddressContraction(option?.address)} and return to this
                page. Confirmation should appear in a few minutes.
              </ModalBody>
              <CopyToClipboard variant="button" string={option.address}>
                Copy Address to Clipboard
              </CopyToClipboard>
            </>
          )}
        </ModalContent>
      )}
    </PageContent>
  );
};

export default WaitingBitcoin;
