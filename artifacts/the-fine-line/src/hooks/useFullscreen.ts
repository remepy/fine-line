import { useEffect } from "react";

/**
 * On the very first user gesture (touch or click) attempts to enter fullscreen
 * and lock the screen to landscape. Both calls require a user gesture and may
 * be silently denied by the browser — we swallow all errors so the game keeps
 * working whether fullscreen is supported or not.
 */
export function useFullscreen() {
  useEffect(() => {
    let done = false;

    const enter = () => {
      if (done) return;
      done = true;

      // Fullscreen — try standard API then webkit prefix
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };

      const req =
        el.requestFullscreen?.bind(el) ??
        el.webkitRequestFullscreen?.bind(el);

      if (req) {
        req().catch(() => {
          /* denied or unsupported — not a problem */
        });
      }

      // Lock orientation to landscape (best-effort)
      try {
        const so = screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        };
        so.lock?.("landscape").catch(() => {
          /* not supported on all browsers */
        });
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("pointerdown", enter, { once: true });
    window.addEventListener("touchstart", enter, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", enter);
      window.removeEventListener("touchstart", enter);
    };
  }, []);
}
