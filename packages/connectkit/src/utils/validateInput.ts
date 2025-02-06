/**
 * Returns true if the value is a valid number.
 * @param value The value to validate.
 * @param maxDecimals The maximum number of decimal places.
 * @returns True if the value is a valid number, false otherwise.
 */
export function isValidNumber(value: string, maxDecimals?: number): boolean {
  if (value.length === 0) {
    return false;
  }

  // Test that the value is digits, followed by an optional decimal, followed
  // by more digits
  if (!/^\d+\.?\d*$/.test(value)) {
    return false;
  }

  const [, digitsAfterDecimal] = (() => {
    if (value.includes(".")) return value.split(".");
    else return [value, ""];
  })();

  if (maxDecimals != null && digitsAfterDecimal.length > maxDecimals) {
    return false;
  }

  return true;
}
