import React from "react";

const PulseLogo = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6.364 1l-.707.707M18 12h-1M4 12H3m1.707-5.293l-.707-.707M16.364 19l-.707-.707M12 18v1m-4.364-1l-.707.707M6 12H5m12 0h1m-1
.707 5.293l-.707.707"
          />
        </svg>
      </div>
    </div>
  );
};

export default PulseLogo;
