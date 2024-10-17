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
      <DaimoPayButton payId="4ssZZX14uTgzFUEB6AYJamvTLG8yXd8EEJqQKvgJjiTn" />
    </div>
  );
};

export default Home;
