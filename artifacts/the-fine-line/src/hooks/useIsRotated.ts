import { useEffect, useState } from "react";

/**
 * Returns true when the device viewport is in portrait orientation
 * AND we should rotate the game 90° to force landscape playback.
 */
export function useIsRotated(): boolean {
  const [rotated, setRotated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const update = () => setRotated(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return rotated;
}
