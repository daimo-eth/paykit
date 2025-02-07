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
  const match = /^\d+\.?(\d*)$/.exec(value);
  if (match == null) return false;

  // Check that the number of digits after the decimal is less than or equal to
  // maxDecimals
  return maxDecimals == null || match[1].length <= maxDecimals;
}
