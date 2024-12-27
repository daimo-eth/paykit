"use client";

import { useState } from "react";
import { Button } from "../shared/tailwind-catalyst/button";
import { Heading } from "../shared/tailwind-catalyst/heading";
import { DemoBasic } from "./DemoBasic";
import { DemoCheckout } from "./DemoCheckout";
import { DemoContract } from "./DemoContract";
import { DemoDeposit } from "./DemoDeposit";

type DemoType = "basic" | "contract" | "checkout" | "deposit";

export default function DemoButtonPage() {
  const [demo, setDemo] = useState<DemoType>("basic");

  const Btn = ({ type, children }: { type: DemoType; children: string }) => (
    <Button onClick={() => setDemo(type)} outline={demo !== type}>
      {children}
    </Button>
  );

  return (
    <main className="w-full max-w-lg m-auto px-4 py-8">
      <Heading>DaimoPayButton Examples</Heading>

      <div className="flex gap-4 mt-8">
        <Btn type="basic">Basic</Btn>
        <Btn type="contract">Contract</Btn>
        <Btn type="checkout">Checkout</Btn>
        <Btn type="deposit">Deposit</Btn>
      </div>

      <div className="mt-8">
        {demo === "basic" && <DemoBasic />}
        {demo === "contract" && <DemoContract />}
        {demo === "checkout" && <DemoCheckout />}
        {demo === "deposit" && <DemoDeposit />}
      </div>
    </main>
  );
}
