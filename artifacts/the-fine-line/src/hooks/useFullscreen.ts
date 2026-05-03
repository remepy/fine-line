import { useCallback, useEffect, useState } from "react";

type DocWithWebkit = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
};

type ElWithWebkit = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function getFullscreenElement(): Element | null {
  const d = document as DocWithWebkit;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function requestFS(): Promise<void> | undefined {
  const el = document.documentElement as ElWithWebkit;
  return (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
}

function exitFS(): Promise<void> | undefined {
  const d = document as DocWithWebkit;
  return (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
}

/**
 * Fullscreen toggle hook.
 *
 * Returns:
 * - `isSupported`: true only when the Fullscreen API is available (Android
 *   Chrome, desktop). Always false on iOS Safari — callers should hide the
 *   toggle button in that case.
 * - `isFullscreen`: live state, updated via the fullscreenchange event.
 * - `toggle`: enters or exits fullscreen. Must be invoked from a user gesture.
 *
 * On the very first user gesture the game also auto-enters fullscreen so the
 * player doesn't have to hunt for the button.
 */
export function useFullscreen() {
  const isSupported =
    typeof document !== "undefined" &&
    (!!document.fullscreenEnabled ||
      !!(document as DocWithWebkit).webkitFullscreenEnabled);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    const onChange = () => setIsFullscreen(!!getFullscreenElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [isSupported]);

  const enter = useCallback(async () => {
    if (!isSupported || getFullscreenElement()) return;
    try {
      await requestFS();
      try {
        await (
          screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          }
        ).lock?.("landscape");
      } catch {
        /* orientation lock not supported — fine */
      }
    } catch {
      /* denied or unsupported */
    }
  }, [isSupported]);

  const exit = useCallback(async () => {
    if (!getFullscreenElement()) return;
    try {
      await exitFS();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    if (getFullscreenElement()) void exit();
    else void enter();
  }, [enter, exit]);

  // Auto-enter fullscreen on the very first user gesture.
  useEffect(() => {
    if (!isSupported) return;
    let done = false;

    const onFirstGesture = () => {
      if (done) return;
      done = true;
      void enter();
    };

    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("touchstart", onFirstGesture, {
      once: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
  }, [isSupported, enter]);

  return { isFullscreen, toggle, isSupported };
}
