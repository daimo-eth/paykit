import { useEffect } from "react";
import { useAccount } from "wagmi";
import { CustomTheme, Languages, Mode, Theme } from "../../types";
import Modal from "../Common/Modal";
import { ROUTES, useContext } from "../DaimoPay";

import About from "../Pages/About";
import Connectors from "../Pages/Connectors";
import DownloadApp from "../Pages/DownloadApp";
import MobileConnectors from "../Pages/MobileConnectors";
import Onboarding from "../Pages/Onboarding";
import Profile from "../Pages/Profile";
import SwitchNetworks from "../Pages/SwitchNetworks";
import ConnectUsing from "./ConnectUsing";

import { getAppName } from "../../defaultConfig";
import { useChainIsSupported } from "../../hooks/useChainIsSupported";
import { DaimoPayThemeProvider } from "../DaimoPayThemeProvider/DaimoPayThemeProvider";
import Confirmation from "../Pages/Confirmation";
import PayWithToken from "../Pages/PayWithToken";
import SelectMethod from "../Pages/SelectMethod";
import SelectToken from "../Pages/SelectToken";
import ConnectorSolana from "../Pages/Solana/ConnectorSolana";
import ConnectSolana from "../Pages/Solana/ConnectSolana";
import PayWithSolanaToken from "../Pages/Solana/PayWithSolanaToken";
import SelectSolanaToken from "../Pages/Solana/SelectSolanaToken";
import WaitingOther from "../Pages/WaitingOther";

const customThemeDefault: object = {};

export const DaimoPayModal: React.FC<{
  mode?: Mode;
  theme?: Theme;
  customTheme?: CustomTheme;
  lang?: Languages;
}> = ({
  mode = "auto",
  theme = "auto",
  customTheme = customThemeDefault,
  lang = "en-US",
}) => {
  const context = useContext();
  const { setSelectedExternalOption, setSelectedTokenOption } =
    context.paymentInfo;
  const { isConnected, chain } = useAccount();
  const chainIsSupported = useChainIsSupported(chain?.id);

  //if chain is unsupported we enforce a "switch chain" prompt
  const closeable = !(
    context.options?.enforceSupportedChains &&
    isConnected &&
    !chainIsSupported
  );

  const showBackButton =
    closeable &&
    context.route !== ROUTES.PROFILE &&
    context.route !== ROUTES.SELECT_METHOD &&
    context.route !== ROUTES.CONFIRMATION;

  const showInfoButton = closeable && context.route !== ROUTES.PROFILE;

  const onBack = () => {
    if (context.route === ROUTES.SWITCHNETWORKS) {
      context.setRoute(ROUTES.PROFILE);
    } else if (context.route === ROUTES.DOWNLOAD) {
      context.setRoute(ROUTES.CONNECT);
    } else if (context.route === ROUTES.CONNECTORS) {
      context.setRoute(ROUTES.SELECT_METHOD);
    } else if (context.route === ROUTES.SELECT_TOKEN) {
      context.setRoute(ROUTES.SELECT_METHOD);
    } else if (context.route === ROUTES.WAITING_OTHER) {
      setSelectedExternalOption(undefined);
      context.setRoute(ROUTES.SELECT_METHOD);
    } else if (context.route === ROUTES.PAY_WITH_TOKEN) {
      setSelectedTokenOption(undefined);
      context.setRoute(ROUTES.SELECT_TOKEN);
    } else if (context.route === ROUTES.ONBOARDING) {
      context.setRoute(ROUTES.CONNECTORS);
    } else {
      context.setRoute(ROUTES.SELECT_METHOD);
    }
  };

  const pages: Record<ROUTES, React.ReactNode> = {
    daimoPaySelectMethod: <SelectMethod />,
    daimoPaySelectToken: <SelectToken />,
    daimoPayWaitingOther: <WaitingOther />,
    daimoPayConfirmation: <Confirmation />,
    daimoPayPayWithToken: <PayWithToken />,
    daimoPaySolanaConnect: <ConnectSolana />,
    daimoPaySolanaConnector: <ConnectorSolana />,
    daimoPaySolanaSelectToken: <SelectSolanaToken />,
    daimoPaySolanaPayWithToken: <PayWithSolanaToken />,

    onboarding: <Onboarding />,
    about: <About />,
    download: <DownloadApp />,
    connectors: <Connectors />,
    mobileConnectors: <MobileConnectors />,
    connect: <ConnectUsing />,
    profile: <Profile />,
    switchNetworks: <SwitchNetworks />,
  };

  function hide() {
    context.setOpen(false);
  }

  useEffect(() => {
    if (
      context.route === ROUTES.CONNECT ||
      context.route === ROUTES.CONNECTORS ||
      context.route === ROUTES.MOBILECONNECTORS
    ) {
      if (isConnected) {
        context.setRoute(ROUTES.SELECT_TOKEN);
      }
    }
  }, [isConnected, context.route]);

  useEffect(() => context.setMode(mode), [mode]);
  useEffect(() => context.setTheme(theme), [theme]);
  useEffect(() => context.setCustomTheme(customTheme), [customTheme]);
  useEffect(() => context.setLang(lang), [lang]);

  /* When pulling data into WalletConnect, it prioritises the og:title tag over the title tag */
  useEffect(() => {
    const appName = getAppName();
    if (!appName || !context.open) return;

    const title = document.createElement("meta");
    title.setAttribute("property", "og:title");
    title.setAttribute("content", appName);
    document.head.prepend(title);

    /*
    // TODO:  When pulling data into WalletConnect, figure out which icon gets used and replace with appIcon if available 
    const appIcon = getAppIcon();
    const icon = document.createElement('link');
    if (appIcon) {
      icon.setAttribute('rel', 'icon');
      icon.setAttribute('href', appIcon);
      document.head.prepend(icon);
    }*/

    return () => {
      document.head.removeChild(title);
      //if (appIcon) document.head.removeChild(icon);
    };
  }, [context.open]);

  return (
    <DaimoPayThemeProvider theme={theme} customTheme={customTheme} mode={mode}>
      <Modal
        open={context.open}
        pages={pages}
        pageId={context.route}
        onClose={closeable ? hide : undefined}
        onInfo={undefined}
        onBack={showBackButton ? onBack : undefined}
      />
    </DaimoPayThemeProvider>
  );
};
