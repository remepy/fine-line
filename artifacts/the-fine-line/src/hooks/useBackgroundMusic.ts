import { useCallback, useEffect, useRef, useState } from "react";
import track1 from "@assets/Palm_Tile_Drift_1777619333976.mp3";
import track2 from "@assets/Terrasse_Bleue_1777619333976.mp3";

const PLAYLIST = [track1, track2];
const VOLUME = 0.35;

export function useBackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

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
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
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
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  return { isPlaying, toggle };
}
