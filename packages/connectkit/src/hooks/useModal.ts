import { ROUTES, useContext } from "../components/DaimoPay";
import {
  useConnectCallback,
  useConnectCallbackProps,
} from "./useConnectCallback";

type UseModalProps = {} & useConnectCallbackProps;

export const useModal = ({ onConnect, onDisconnect }: UseModalProps = {}) => {
  const context = useContext();

  useConnectCallback({
    onConnect,
    onDisconnect,
  });

  const close = () => {
    context.setOpen(false);
  };
  const open = () => {
    context.setOpen(true);
  };

  const gotoAndOpen = (route: ROUTES) => {
    context.setRoute(route);
    open();
  };

  return {
    open: context.open,
    setOpen: (show: boolean) => {
      if (show) {
        gotoAndOpen(ROUTES.SELECT_METHOD);
      } else {
        close();
      }
    },
    // Disconnected Routes
    openAbout: () => gotoAndOpen(ROUTES.ABOUT),
    openOnboarding: () => gotoAndOpen(ROUTES.ONBOARDING),
    openSwitchNetworks: () => gotoAndOpen(ROUTES.SWITCHNETWORKS),
  };
};
