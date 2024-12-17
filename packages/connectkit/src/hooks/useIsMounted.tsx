import { useEffect, useState } from "react";

/** Utility. Returns false on first render, true after.
 * Useful for apps with SSR, for example. */
export default function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
