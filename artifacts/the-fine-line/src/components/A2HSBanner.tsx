import { useState, useEffect } from "react";
import { copy } from "../lib/copy";

const DISMISSED_KEY = "a2hs-dismissed";

function isIosSafariNotStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isStandalone = (navigator as { standalone?: boolean }).standalone === true;
  const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome|android/i.test(ua);
  return isIos && isSafari && !isStandalone;
}

export function A2HSBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafariNotStandalone()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="a2hs-banner" role="status">
      <span className="a2hs-text">
        {copy(null, "addToHomeBeforeShare")}{" "}
        {/* iOS share icon */}
        <svg
          className="a2hs-share-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label={copy(null, "share")}
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {" "}{copy(null, "addToHomeAfterShare")}
      </span>
      <button
        className="a2hs-dismiss"
        onClick={dismiss}
        aria-label={copy(null, "dismiss")}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
