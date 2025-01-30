import type { Metadata } from "next";
import { type ReactNode } from "react";

import { StyledComponentsRegistry } from "../styles/StyledComponentsRegistry";
import "../styles/tailwind.css";
import NavButtons from "./nav-buttons";

export const metadata: Metadata = {
  title: "Daimo Pay Demo",
  description: "One-click crypto",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <main className="bg-white h-screen w-full max-w-lg m-auto px-4 py-8">
            <NavButtons />
            <div className="mt-8">{props.children}</div>
          </main>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
