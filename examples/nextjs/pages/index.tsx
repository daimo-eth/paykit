import type { NextPage } from "next";
import { ConnectKitButton } from "@daimo/pay";

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
      <ConnectKitButton payId="Fcdcb474QD4s9KPQzaKgdz3UJTMnZVhks51WpMp2TdSV" />
    </div>
  );
};

export default Home;
