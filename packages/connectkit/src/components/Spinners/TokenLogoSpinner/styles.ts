import { motion } from "framer-motion";
import styled from "../../../styles/styled";

export const ChainLogoContainer = styled(motion.div)`
  z-index: 10;
  position: absolute;
  right: 2px;
  bottom: 2px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;

  color: var(--ck-body-background);
  transition: color 200ms ease;

  &:before {
    z-index: 5;
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 200ms ease;
    background: var(--ck-body-color);
  }

  svg {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
  }
`;
