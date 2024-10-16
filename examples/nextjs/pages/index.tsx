import { DaimoPayButton } from "@daimo/pay";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <DaimoPayButton payId="D3tekbu6T2uSRnaSQVmEwurjeYcQ5NdtMNbnwG4Uh5Wk" />
    </div>
  );
};

export default Home;
