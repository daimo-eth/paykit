import { useEffect, useState } from "react";

export function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copyCount, setCopyCount] = useState(0);
  const copied = copyCount > 0;

  useEffect(() => {
    if (copyCount > 0) {
      const timeout = setTimeout(() => setCopyCount(0), 1500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copyCount]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy);
    setCopyCount((count) => count + 1);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
    >
      <span>Copy the current URL</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform ${copied ? "scale-110" : ""}`}
      >
        {copied ? (
          // Checkmark icon
          <path
            d="M3 8L6.5 11.5L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // Copy icon
          <>
            <rect
              x="4"
              y="4"
              width="8"
              height="8"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 4V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>
    </button>
  );
}
