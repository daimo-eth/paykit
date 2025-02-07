import React, { useEffect, useRef } from "react";
import styled from "../../../styles/styled";
import { ModalBody } from "../Modal/styles";

const Container = styled.button`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
`;

const InputField = styled.input`
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  outline: none;
  font-size: 30px;
  font-weight: var(--ck-modal-h1-font-weight, 600);
  color: var(--ck-body-color);
  width: ${(props) => {
    const length = props.value?.length || 1;
    // Reduce width when decimal or commas are present since they're smaller than normal chars
    const numPunctuations = (props.value?.match(/[.,]/g) || []).length;
    const adjustedLength = length - numPunctuations * 0.6;
    return `${Math.min(adjustedLength, 10)}ch`;
  }};
  min-width: 1ch;
  max-width: 10ch;
`;

const AmountInputField: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currency?: string;
}> = ({ value, onChange, currency = "$" }) => {
  // Focus the input when the component mounts so the user can start typing immediately
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Container>
      {currency === "$" && <ModalBody>{currency}</ModalBody>}
      <InputField
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
      />
      {currency !== "$" && <ModalBody>{currency}</ModalBody>}
    </Container>
  );
};

export default AmountInputField;
