import type { Metadata } from "next";
import { type ReactNode } from "react";
import { Providers } from "./providers";

import { StyledComponentsRegistry } from "../styles/StyledComponentsRegistry";
import "../styles/tailwind.css";

export const metadata: Metadata = {
  title: "@daimo/pay demo",
  description: "One-click crypto",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Providers>{props.children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
