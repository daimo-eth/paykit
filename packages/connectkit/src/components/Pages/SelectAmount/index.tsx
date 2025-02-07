import React from "react";
import { ROUTES, usePayContext } from "../../DaimoPay";

import MultiCurrencySelectAmount from "../../Common/AmountInput";
import { PageContent } from "../../Common/Modal/styles";

const SelectAmount: React.FC = () => {
  const { paymentState } = usePayContext();
  const { selectedTokenBalance, setSelectedTokenOption } = paymentState;

  if (selectedTokenBalance == null) {
    return <PageContent></PageContent>;
  }

  return (
    <MultiCurrencySelectAmount
      selectedTokenBalance={selectedTokenBalance}
      setSelectedTokenOption={setSelectedTokenOption}
      nextPage={ROUTES.PAY_WITH_TOKEN}
    />
  );
};

export default SelectAmount;
