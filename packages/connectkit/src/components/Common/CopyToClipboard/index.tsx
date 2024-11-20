import React, { useState } from "react";
import { css } from "styled-components";
import styled from "./../../../styles/styled";

import Button from "../Button";
import CopyToClipboardIcon from "./CopyToClipboardIcon";

const Container = styled.div<{ $disabled?: boolean }>`
  --color: var(--ck-copytoclipboard-stroke);
  --bg: var(--ck-body-background);
  transition: all 220ms cubic-bezier(0.175, 0.885, 0.32, 1.1);

  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  gap: 8px;

  ${(props) =>
    props.$disabled
      ? css`
          cursor: not-allowed;
          opacity: 0.4;
        `
      : css`
          &:hover {
            --color: var(--ck-body-color-muted);
          }
        `}
`;

const CopyToClipboard: React.FC<{
  string?: string;
  children?: React.ReactNode;
  variant?: "button" | "left";
}> = ({ string, children, variant }) => {
  const [clipboard, setClipboard] = useState(false);

  let timeout: any;
  const onCopy = () => {
    if (!string) return;
    const str = string.trim();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(str);
    } else {
      // Fallback copy to clipboard if necessary
      /*
      const el = document.createElement('textarea');
      el.value = str;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      */
    }
    setClipboard(true);
    clearTimeout(timeout);
    timeout = setTimeout(() => setClipboard(false), 1000);
  };

  if (variant === "button")
    return (
      <Button
        disabled={!string}
        onClick={onCopy}
        icon={<CopyToClipboardIcon copied={clipboard} />}
      >
        {children}
      </Button>
    );

  return (
    <Container onClick={onCopy} $disabled={!string}>
      <CopyToClipboardIcon copied={clipboard} dark />
      {children}
    </Container>
  );
};

export default CopyToClipboard;
