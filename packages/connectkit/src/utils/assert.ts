/**
 * Assert a condition and throw an error if it is not met.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error("Assertion failed: " + message);
}

/**
 * Assert that a value is not null or undefined and throw an error if it is.
 */
export function assertNotNull<T>(
  value: T | null | undefined,
  message: string,
): T {
  assert(value !== null && value !== undefined, message);
  return value;
}
