import { useEffect, useState } from "react";

/**
 * Returns true when a touch browser's layout viewport is portrait.
 * Use the same orientation signal as CSS, not screen.orientation.type:
 * screen orientation and the actual page layout can disagree.
 * This does not detect physical motion while OS rotation lock is enabled.
 */

function checkPortrait(): boolean {
  if (typeof window === "undefined") return false;
  // Only prompt on real touch devices — not desktop browsers
  if (!navigator.maxTouchPoints) return false;

  return window.matchMedia("(orientation: portrait)").matches;
}

export function useIsRotated(): boolean {
  const [portrait, setPortrait] = useState<boolean>(checkPortrait);

  useEffect(() => {
    let settleTimers: number[] = [];
    const update = () => setPortrait(checkPortrait());
    const recheck = () => {
      settleTimers.forEach(window.clearTimeout);
      update();
      // Some browsers emit rotation events before the layout has settled.
      settleTimers = [100, 300, 700, 1500].map((delay) =>
        window.setTimeout(update, delay),
      );
    };
    const mq = window.matchMedia("(orientation: portrait)");
    const orientation = window.screen.orientation;
    const viewport = window.visualViewport;
    // Treat screen orientation as a notification, never as the source of truth.
    orientation?.addEventListener?.("change", recheck);
    if (mq.addEventListener) mq.addEventListener("change", recheck);
    else mq.addListener(recheck);
    window.addEventListener("resize", recheck);
    window.addEventListener("orientationchange", recheck);
    viewport?.addEventListener("resize", recheck);
    window.addEventListener("pageshow", recheck);
    document.addEventListener("visibilitychange", recheck);

    // Re-evaluate immediately in case orientation changed before mount
    recheck();

    return () => {
      settleTimers.forEach(window.clearTimeout);
      orientation?.removeEventListener?.("change", recheck);
      if (mq.removeEventListener) mq.removeEventListener("change", recheck);
      else mq.removeListener(recheck);
      window.removeEventListener("resize", recheck);
      window.removeEventListener("orientationchange", recheck);
      viewport?.removeEventListener("resize", recheck);
      window.removeEventListener("pageshow", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  return portrait;
}
