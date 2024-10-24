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
      <DaimoPayButton payId={"GgQn1RGAXx2QufJ6mwtZty6cJGMzQBMx8qQL8Dw7Jw8Y"} />
    </div>
  );
};

export default Home;
