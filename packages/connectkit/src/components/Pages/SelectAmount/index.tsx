import React from "react";
import MultiCurrencySelectAmount from "../../Common/AmountInput";
import { PageContent } from "../../Common/Modal/styles";
import { ROUTES, usePayContext } from "../../DaimoPay";

const SelectAmount: React.FC = () => {
  const { paymentState } = usePayContext();
  const { selectedTokenOption, setSelectedTokenOption } = paymentState;

  if (selectedTokenOption == null) {
    return <PageContent></PageContent>;
  }

  return (
    <MultiCurrencySelectAmount
      selectedTokenOption={selectedTokenOption}
      setSelectedTokenOption={setSelectedTokenOption}
      nextPage={ROUTES.PAY_WITH_TOKEN}
    />
  );
};

export default SelectAmount;
