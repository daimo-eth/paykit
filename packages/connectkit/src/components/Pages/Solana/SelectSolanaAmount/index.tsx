import React from "react";
import { ROUTES, usePayContext } from "../../../DaimoPay";

import MultiCurrencySelectAmount from "../../../Common/AmountInput";
import { PageContent } from "../../../Common/Modal/styles";

const SelectSolanaAmount: React.FC = () => {
  const { paymentState } = usePayContext();
  const { selectedSolanaTokenOption, setSelectedSolanaTokenOption } =
    paymentState;

  if (selectedSolanaTokenOption == null) {
    return <PageContent></PageContent>;
  }

  return (
    <MultiCurrencySelectAmount
      selectedTokenOption={selectedSolanaTokenOption}
      setSelectedTokenOption={setSelectedSolanaTokenOption}
      nextPage={ROUTES.SOLANA_PAY_WITH_TOKEN}
    />
  );
};

export default SelectSolanaAmount;
