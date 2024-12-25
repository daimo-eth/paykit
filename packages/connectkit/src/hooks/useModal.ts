import { ROUTES, usePayContext } from "../components/DaimoPay";
import {
  useConnectCallback,
  useConnectCallbackProps,
} from "./useConnectCallback";

type UseModalProps = {} & useConnectCallbackProps;

/** Opens and closes the payment modal. */
export const useModal = ({ onConnect, onDisconnect }: UseModalProps = {}) => {
  const context = usePayContext();

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
  };
};
