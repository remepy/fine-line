import { useCallback, useEffect, useRef, useState } from "react";
import track from "@assets/background-music.mp3";

const VOLUME = 0.35;

/**
 * Background music: one looping track.
 *
 * `enabled` follows the session (it goes false while the app pauses us), but
 * the Audio element is created once and only paused and resumed, so a pause
 * from the app does not restart the music from the top. The participant's own
 * on/off choice is kept separately in `wantsMusic` and survives a pause.
 */
export function useBackgroundMusic(enabled = true) {
  const [wantsMusic, setWantsMusic] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsMusicRef = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    wantsMusicRef.current = wantsMusic;
  }, [wantsMusic]);

  // Created once for the life of the page.
  useEffect(() => {
    const audio = new Audio(track);
    audio.volume = VOLUME;
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    // WebViews and browsers block audio until the first gesture, so an
    // immediate play() is expected to reject; we retry on the first tap.
    const tryPlay = () => {
      const el = audioRef.current;
      if (!el || !wantsMusicRef.current) return Promise.resolve();
      return el.play().then(
        () => { hasStartedRef.current = true; },
        () => { /* deferred until a user gesture */ },
      );
    };

    const cleanupGestures = () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
    };

    function handleFirstGesture() {
      if (hasStartedRef.current || !wantsMusicRef.current) {
        cleanupGestures();
        return;
      }
      void tryPlay().then(() => {
        if (hasStartedRef.current) cleanupGestures();
      });
    }

    void tryPlay();
    window.addEventListener("pointerdown", handleFirstGesture);
    window.addEventListener("keydown", handleFirstGesture);
    window.addEventListener("touchstart", handleFirstGesture);

    return () => {
      cleanupGestures();
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Pause and resume in place as the session goes inactive and back.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Either reason to be silent pauses it: the app interrupting us, or the
    // participant switching it off. Testing only `enabled` here left the
    // toggle flipping its icon while the audio kept playing.
    if (!enabled || !wantsMusic) {
      audio.pause();
    } else {
      void audio.play().then(
        () => { hasStartedRef.current = true; },
        () => { /* still waiting on a gesture */ },
      );
    }
  }, [enabled, wantsMusic]);

  const toggle = useCallback(() => {
    setWantsMusic((on) => !on);
  }, []);

  // The icon reflects the participant's own choice, not the app's pause: a
  // pause should not look like the game turned their music off.
  return { isPlaying: wantsMusic, toggle };
}
