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
        payId={"9dFTs9wMMC9YjpmMUVxAU8GQ4Ed5uV9WTpTKBgPmdnFo"}
        closeOnSuccess
      />
    </div>
  );
};

export default Home;
