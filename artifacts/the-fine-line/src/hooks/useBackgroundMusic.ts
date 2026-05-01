import { useCallback, useEffect, useRef, useState } from "react";
import track1 from "@assets/Palm_Tile_Drift_1777619333976.mp3";
import track2 from "@assets/Terrasse_Bleue_1777619333976.mp3";

const PLAYLIST = [track1, track2];
const VOLUME = 0.35;

export function useBackgroundMusic() {
  // Default desired state is ON; actual playback may be deferred until the
  // first user interaction because of browser autoplay policies.
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio(PLAYLIST[0]);
    audio.volume = VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    const handleEnded = () => {
      trackIndexRef.current = (trackIndexRef.current + 1) % PLAYLIST.length;
      audio.src = PLAYLIST[trackIndexRef.current];
      if (isPlayingRef.current) {
        audio.play().catch(() => {
          /* ignore — gesture-gated */
        });
      }
    };

    audio.addEventListener("ended", handleEnded);

    // Try to autoplay immediately. In most browsers this will reject
    // because there has been no user gesture yet — that's fine, we'll
    // start on the first interaction below.
    const tryPlay = () => {
      if (!isPlayingRef.current || !audioRef.current) return Promise.resolve();
      return audioRef.current
        .play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {
          /* deferred until first user gesture */
        });
    };

    void tryPlay();

    // Fallback: start on the first user interaction anywhere on the page.
    const handleFirstGesture = () => {
      if (hasStartedRef.current || !isPlayingRef.current) {
        cleanupGestures();
        return;
      }
      void tryPlay().then(() => {
        if (hasStartedRef.current) cleanupGestures();
      });
    };

    const cleanupGestures = () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
    };

    window.addEventListener("pointerdown", handleFirstGesture);
    window.addEventListener("keydown", handleFirstGesture);
    window.addEventListener("touchstart", handleFirstGesture);

    return () => {
      cleanupGestures();
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          hasStartedRef.current = true;
          setIsPlaying(true);
        })
        .catch(() => setIsPlaying(false));
    }
  }, []);

  return { isPlaying, toggle };
}
