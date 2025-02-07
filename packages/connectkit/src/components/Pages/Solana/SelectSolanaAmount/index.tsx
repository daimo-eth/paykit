import React from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import MultiCurrencySelectAmount from "../../../Common/AmountInput";
import { PageContent } from "../../../Common/Modal/styles";

const SelectSolanaAmount: React.FC = () => {
  const { paymentState } = usePayContext();
  const { selectedSolanaTokenBalance, setSelectedSolanaTokenOption } =
    paymentState;

  if (selectedSolanaTokenBalance == null) {
    return <PageContent></PageContent>;
  }

  return (
    <MultiCurrencySelectAmount
      selectedTokenBalance={selectedSolanaTokenBalance}
      setSelectedTokenOption={setSelectedSolanaTokenOption}
      nextPage={ROUTES.SOLANA_PAY_WITH_TOKEN}
    />
  );
};

export default SelectSolanaAmount;
