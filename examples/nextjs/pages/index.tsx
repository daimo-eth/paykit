import { writeDaimoPayOrderID } from "@daimo/common";
import { DaimoPayButton, useDaimoPayStatus } from "@daimo/pay";
import type { NextPage } from "next";

const Home: NextPage = () => {
  const status = useDaimoPayStatus();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      {status?.status === "payment_completed" ? "🎉" : "💰"}
      <DaimoPayButton
        payId={writeDaimoPayOrderID(
          128137641854706417766070727187199052376376149641762183903264079086073036664n,
        )}
      />
    </div>
  );
};

export default Home;
