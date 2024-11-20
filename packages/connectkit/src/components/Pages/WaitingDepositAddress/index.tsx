import React, { useEffect, useState } from "react";
import { ROUTES, useContext } from "../../DaimoPay";

import {
  ModalBody,
  ModalContent,
  ModalH1,
  PageContent,
} from "../../Common/Modal/styles";

import {
  DepositAddressPaymentOptionData,
  getAddressContraction,
} from "@daimo/common";
import ScanIconWithLogos from "../../../assets/ScanIconWithLogos";
import { trpc } from "../../../utils/trpc";
import Button from "../../Common/Button";
import CopyToClipboard from "../../Common/CopyToClipboard";
import CustomQRCode from "../../Common/CustomQRCode";
import { OrDivider } from "../../Common/Modal";

const WaitingDepositAddress: React.FC = () => {
  const { triggerResize, paymentInfo, setRoute } = useContext();
  const { daimoPayOrder, payWithDepositAddress, selectedDepositAddressOption } =
    paymentInfo;

  useEffect(() => {
    const checkForSourcePayment = async () => {
      if (!daimoPayOrder || !selectedDepositAddressOption) return;

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

  const [details, setDetails] = useState<DepositAddressPaymentOptionData>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!selectedDepositAddressOption) return;

    payWithDepositAddress(selectedDepositAddressOption.id).then((details) => {
      if (!details) setFailed(true);
      else setDetails(details);
    });
  }, [selectedDepositAddressOption]);

  useEffect(() => {
    triggerResize();
  }, [details]);

  return (
    <PageContent>
      {failed ? (
        <ModalContent style={{ marginLeft: 24, marginRight: 24 }}>
          <ModalH1>{selectedDepositAddressOption} unavailable</ModalH1>
          <ModalBody>
            We're unable to process {selectedDepositAddressOption} payments at
            this time. Please select another payment method.
          </ModalBody>
          <Button onClick={() => setRoute(ROUTES.SELECT_METHOD)}>
            Select Another Method
          </Button>
        </ModalContent>
      ) : (
        <ModalContent>
          <CustomQRCode
            value={details?.uri}
            image={
              <img
                src={selectedDepositAddressOption?.logoURI}
                width="100%"
                height="100%"
              />
            }
            tooltipMessage={
              <>
                <ScanIconWithLogos
                  logo={<img src={selectedDepositAddressOption?.logoURI} />}
                />
                <span>
                  Use a {selectedDepositAddressOption?.id} wallet to scan
                </span>
              </>
            }
          />
          {details && (
            <>
              <OrDivider />
              <ModalBody>
                Send exactly {details.amount} {details.suffix} to{" "}
                {getAddressContraction(details.address)} and return to this
                page. Confirmation should appear in a few minutes.
              </ModalBody>
              <CopyToClipboard variant="button" string={details.address}>
                Copy Address
              </CopyToClipboard>
              <CopyToClipboard variant="left" string={details.amount}>
                Copy Amount
              </CopyToClipboard>
            </>
          )}
        </ModalContent>
      )}
    </PageContent>
  );
};

export default WaitingDepositAddress;
