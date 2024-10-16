import React, { createContext, createElement } from "react";
import { CustomTheme, Mode, Theme } from "../../types";

type ContextValue = {
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;
};

const Context = createContext<ContextValue | null>(null);

type DaimoPayThemeProviderProps = {
  children?: React.ReactNode;
  theme?: Theme;
  mode?: Mode;
  customTheme?: CustomTheme;
};

export const DaimoPayThemeProvider: React.FC<DaimoPayThemeProviderProps> = ({
  children,
  theme = "auto",
  mode = "auto",
  customTheme,
}) => {
  const value = {
    theme,
    mode,
    customTheme,
  };

  return createElement(Context.Provider, { value }, <>{children}</>);
};

export const useThemeContext = () => {
  const context = React.useContext(Context);
  if (!context) throw Error("DaimoPayThemeProvider must be inside a Provider.");
  return context;
};
