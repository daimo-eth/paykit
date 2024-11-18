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
      <DaimoPayButton payId={"4Dx8TfefkU1mVoWGpyEUydJ95a18Bwb7LwYMppsR9ADj"} />
    </div>
  );
};

export default Home;
