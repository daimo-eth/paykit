import React from "react";

import { BrowserIconContainer } from "./styles";
import { BrowserIconProps } from "./types";

import browsers from "../../../assets/browsers";
import { detectBrowser } from "../../../utils";

const BrowserIcon = React.forwardRef(
  ({ browser }: BrowserIconProps, ref: React.Ref<HTMLElement>) => {
    const currentBrowser = browser ?? detectBrowser();

    let icon;
    switch (currentBrowser) {
      case "chrome":
        icon = browsers.Chrome;
        break;
      case "firefox":
        icon = browsers.FireFox;
        break;
      case "edge":
        icon = browsers.Edge;
        break;
      case "brave":
        //   icon = browsers.Brave;
        break;
    }
    if (!icon) return <></>;
    return <BrowserIconContainer>{icon}</BrowserIconContainer>;
  },
);
BrowserIcon.displayName = "BrowserIcon";

export default BrowserIcon;
