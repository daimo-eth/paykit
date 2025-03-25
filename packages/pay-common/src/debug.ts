/** Return compact JSON, 10000 chars max. Never throws. */
export function debugJson(obj: any) {
  try {
    const serialized = JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    return serialized.slice(0, 10000);
  } catch (e: any) {
    return `<JSON error: ${e.message}>`;
  }
}
