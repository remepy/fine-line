import { useState, useEffect, useCallback, useRef } from "react";
import { parseHitmap, Zone, checkHit } from "../lib/hitmap";

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

export interface FoundMarker {
  id: number;
  tapX: number; // fraction 0-1 relative to image where the tap landed
  tapY: number;
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
  const [zones, setZones] = useState<Zone[]>([]);
  const [foundMarkers, setFoundMarkers] = useState<FoundMarker[]>([]);
  const [hintIds, setHintIds] = useState<number[]>([]);
  const [sparks, setSparks] = useState<SparkleEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const sparkIdRef = useRef(0);

  useEffect(() => {
    fetch(buildUrl("image-sets/manifest.json"))
      .then((r) => r.json())
      .then((data: ImageSet[]) => {
        setAllSets(data);
      })
      .catch(console.error);
  }, []);

  const loadLevel = useCallback(
    async (sets: ImageSet[], used: number[], lvl: number) => {
      if (sets.length === 0) return;
      setLoading(true);
      setFoundMarkers([]);
      setHintIds([]);
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
        setZones(parsed);
      } catch (e) {
        console.error("hitmap parse error", e);
        setZones([]);
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
      if (loading) return;
      const rect = imageEl.getBoundingClientRect();
      const relX = tapX / rect.width;
      const relY = tapY / rect.height;
      const absX = rect.left + tapX;
      const absY = rect.top + tapY;

      const foundIds = foundMarkers.map((m) => m.id);
      const foundSet = new Set([...foundIds, ...hintIds]);
      const hit = checkHit(relX, relY, zones, foundSet);

      if (hit !== null) {
        addSpark(absX, absY, true);
        setFoundMarkers((prev) => [
          ...prev,
          { id: hit, tapX: relX, tapY: relY },
        ]);
      } else {
        addSpark(absX, absY, false);
      }
    },
    [loading, foundMarkers, hintIds, zones, addSpark]
  );

  const handleHint = useCallback(() => {
    if (loading) return;
    const foundIds = foundMarkers.map((m) => m.id);
    const revealedSet = new Set([...foundIds, ...hintIds]);
    const unrevealedZone = zones.find((z) => !revealedSet.has(z.id));
    if (unrevealedZone) {
      setHintIds((prev) => [...prev, unrevealedZone.id]);
    }
  }, [loading, foundMarkers, hintIds, zones]);

  const nextLevel = useCallback(() => {
    loadLevel(allSets, usedIndices, level + 1);
  }, [allSets, usedIndices, level, loadLevel]);

  const foundIds = foundMarkers.map((m) => m.id);
  const allFound =
    zones.length > 0 &&
    foundIds.length + hintIds.length >= zones.length;

  return {
    level,
    imageSet,
    zones,
    foundMarkers,
    foundIds,
    hintIds,
    sparks,
    loading,
    allFound,
    totalSets: allSets.length,
    handleTap,
    handleHint,
    nextLevel,
  };
}
