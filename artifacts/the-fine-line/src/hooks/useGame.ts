import { useState, useEffect, useCallback, useRef } from "react";
import { parseHitmap, HitmapData, checkHit } from "../lib/hitmap";

export interface ImageSet {
  id: string;
  name: string;
  original: string;
  modified: string;
  hitmap: string;
}

export interface SparkleEffect {
  id: number;
  x: number;
  y: number;
  success: boolean;
}

export interface RevealedMarker {
  id: number;
  tapX: number;
  tapY: number;
  type: "found" | "hint";
}

const BASE = import.meta.env.BASE_URL;

function buildUrl(path: string) {
  return `${BASE}${path}`;
}

export function useGame() {
  const [allSets, setAllSets] = useState<ImageSet[]>([]);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [imageSet, setImageSet] = useState<ImageSet | null>(null);
  const [hitmapData, setHitmapData] = useState<HitmapData | null>(null);
  const [revealedMarkers, setRevealedMarkers] = useState<RevealedMarker[]>([]);
  const [sparks, setSparks] = useState<SparkleEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const sparkIdRef = useRef(0);

  useEffect(() => {
    fetch(buildUrl("image-sets/manifest.json"))
      .then((r) => r.json())
      .then((data: ImageSet[]) => setAllSets(data))
      .catch(console.error);
  }, []);

  const loadLevel = useCallback(
    async (sets: ImageSet[], used: number[], lvl: number) => {
      if (sets.length === 0) return;
      setLoading(true);
      setHitmapData(null);
      setRevealedMarkers([]);
      setSparks([]);

      let remaining = sets.map((_, i) => i).filter((i) => !used.includes(i));
      if (remaining.length === 0) {
        remaining = sets.map((_, i) => i);
        setUsedIndices([]);
      }

      const idx = remaining[Math.floor(Math.random() * remaining.length)];
      const set = sets[idx];
      setUsedIndices((prev) => [...prev, idx]);
      setImageSet(set);
      setLevel(lvl);

      try {
        const parsed = await parseHitmap(buildUrl(set.hitmap));
        setHitmapData(parsed);
      } catch (e) {
        console.error("hitmap parse error", e);
      }

      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (allSets.length > 0) {
      loadLevel(allSets, [], 1);
    }
  }, [allSets, loadLevel]);

  const addSpark = useCallback((x: number, y: number, success: boolean) => {
    const id = ++sparkIdRef.current;
    setSparks((prev) => [...prev, { id, x, y, success }]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id));
    }, 350);
  }, []);

  const handleTap = useCallback(
    (tapX: number, tapY: number, imageEl: HTMLElement) => {
      if (loading || !hitmapData) return;
      const rect = imageEl.getBoundingClientRect();
      const relX = tapX / rect.width;
      const relY = tapY / rect.height;
      const absX = rect.left + tapX;
      const absY = rect.top + tapY;

      const foundIds = new Set(revealedMarkers.map((m) => m.id));
      const hit = checkHit(relX, relY, rect.width, rect.height, hitmapData, foundIds);

      if (hit !== null) {
        addSpark(absX, absY, true);
        setRevealedMarkers((prev) => [
          ...prev,
          { id: hit, tapX: relX, tapY: relY, type: "found" },
        ]);
      } else {
        addSpark(absX, absY, false);
      }
    },
    [loading, hitmapData, revealedMarkers, addSpark]
  );

  const handleHint = useCallback(() => {
    if (loading || !hitmapData) return;
    const foundIds = new Set(revealedMarkers.map((m) => m.id));
    const unrevealedZone = hitmapData.zones.find((z) => !foundIds.has(z.id));
    if (unrevealedZone) {
      setRevealedMarkers((prev) => [
        ...prev,
        {
          id: unrevealedZone.id,
          tapX: unrevealedZone.cx,
          tapY: unrevealedZone.cy,
          type: "hint",
        },
      ]);
    }
  }, [loading, hitmapData, revealedMarkers]);

  const nextLevel = useCallback(() => {
    loadLevel(allSets, usedIndices, level + 1);
  }, [allSets, usedIndices, level, loadLevel]);

  const zones = hitmapData?.zones ?? [];
  const allFound = zones.length > 0 && revealedMarkers.length >= zones.length;

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!allFound) {
      setShowSuccess(false);
      return;
    }
    const t = setTimeout(() => setShowSuccess(true), 2000);
    return () => clearTimeout(t);
  }, [allFound]);

  const hintsLeft = zones.length - revealedMarkers.length;

  return {
    level,
    imageSet,
    zones,
    revealedMarkers,
    sparks,
    loading,
    allFound,
    showSuccess,
    hintsLeft,
    totalSets: allSets.length,
    handleTap,
    handleHint,
    nextLevel,
  };
}
