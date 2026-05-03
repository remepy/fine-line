import { useEffect, useState } from "react";

/**
 * Returns true when a touch device is being held in portrait orientation
 * (viewport height > width). Shows the "please rotate" overlay.
 *
 * Uses window.innerWidth/innerHeight (the most reliable signal on Android
 * Chrome) and listens to both `orientationchange` and `resize` so it reacts
 * correctly on all mobile browsers.
 */

function checkPortrait(): boolean {
  if (typeof window === "undefined") return false;
  // Only prompt on real touch devices — not desktop browsers
  if (!navigator.maxTouchPoints) return false;
  return window.innerWidth < window.innerHeight;
}

export function useIsRotated(): boolean {
  const [portrait, setPortrait] = useState<boolean>(checkPortrait);

  useEffect(() => {
    const update = () => setPortrait(checkPortrait());

    // orientationchange fires first on Android (before resize settles)
    window.addEventListener("orientationchange", update);
    // resize catches the viewport settling after the rotation animation
    window.addEventListener("resize", update);
    // MediaQueryList change as an additional signal
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", update);

    // Re-evaluate immediately in case orientation changed before mount
    update();

    return () => {
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return portrait;
}
