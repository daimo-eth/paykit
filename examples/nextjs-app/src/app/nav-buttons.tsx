"use client";

import { version } from "@daimo/pay";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../shared/tailwind-catalyst/button";
import { Heading } from "../shared/tailwind-catalyst/heading";

export default function NavButtons() {
  const pathname = usePathname();

  const Btn = ({ route, children }: { route: string; children: string }) => (
    <Link href={route}>
      {pathname === route ? (
        <span className="inline-flex px-4 py-2 rounded-md bg-green-medium hover:bg-green-dark text-white transition-colors">
          {children}
        </span>
      ) : (
        <Button
          outline
          className="inline-flex px-4 py-2 rounded-md border-green-medium text-green-dark hover:bg-cream-medium"
        >
          {children}
        </Button>
      )}
    </Link>
  );

  return (
    <>
      <Heading className="text-green-dark">DaimoPayButton Examples</Heading>
      <div className="mt-1 text-sm text-green-medium">
        @daimo/pay v{version}
      </div>

      <div className="flex flex-wrap gap-4 mt-10">
        <Btn route="/basic">Basic</Btn>
        <Btn route="/contract">Contract</Btn>
        <Btn route="/checkout">Checkout</Btn>
        <Btn route="/deposit">Deposit</Btn>
        <Btn route="/farcaster-frame">Farcaster</Btn>
      </div>
    </>
  );
}
