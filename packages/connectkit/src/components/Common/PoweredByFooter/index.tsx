import { motion } from "framer-motion";
import CrepeIcon from "../../../assets/crepe";
import styled from "../../../styles/styled";

const PoweredByFooter = () => {
  return (
    <Container>
      <TextButton
        onClick={() => {
          window.open("https://pay.daimo.com?ref=paykit", "_blank");
        }}
      >
        <CrepeIcon />
        Powered by Daimo Pay
      </TextButton>
    </Container>
  );
};

const Container = styled(motion.div)`
  text-align: center;
  margin-top: 16px;
  margin-bottom: -4px;
`;

const TextButton = styled(motion.button)`
  appearance: none;
  user-select: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 42px;
  padding: 0 16px;
  border-radius: 6px;
  background: none;
  color: var(--ck-body-color-muted);
  font-size: 15px;
  line-height: 18px;
  font-weight: 500;
  transition:
    color 200ms ease,
    transform 100ms ease;
  &:hover {
    color: var(--ck-body-color-muted-hover);
  }
  &:active {
    transform: scale(0.96);
  }
`;

export default PoweredByFooter;
