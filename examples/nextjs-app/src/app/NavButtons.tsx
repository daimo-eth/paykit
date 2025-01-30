"use client";

import { version } from "@daimo/pay";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../shared/tailwind-catalyst/button";
import { Heading } from "../shared/tailwind-catalyst/heading";

export default function NavButtons() {
  const pathname = usePathname();

  const Btn = ({ route, children }: { route: string; children: string }) => (
    <Button outline={pathname !== route}>
      <Link href={route}>{children}</Link>
    </Button>
  );

  return (
    <>
      <Heading>DaimoPayButton Examples</Heading>
      <div className="mt-1 text-sm text-gray-500 ">@daimo/pay v{version}</div>

      <div className="flex gap-4 mt-10">
        <Btn route="/basic">Basic</Btn>
        <Btn route="/contract">Contract</Btn>
        <Btn route="/checkout">Checkout</Btn>
        <Btn route="/deposit">Deposit</Btn>
      </div>
    </>
  );
}
