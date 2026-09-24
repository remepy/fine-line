import { useState, useEffect, useCallback, useRef } from "react";
import { parseHitmap, HitmapData, checkHit } from "../lib/hitmap";
import type { BridgeSession } from "../lib/cyanBridge";
import { reportError } from "../lib/cyanBridge";

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

export function useGame(session: BridgeSession | null, active: boolean, paused: boolean) {
  const [allSets, setAllSets] = useState<ImageSet[]>([]);
  const [level, setLevel] = useState(1);
  const [imageSet, setImageSet] = useState<ImageSet | null>(null);
  const [hitmapData, setHitmapData] = useState<HitmapData | null>(null);
  const [revealedMarkers, setRevealedMarkers] = useState<RevealedMarker[]>([]);
  const [sparks, setSparks] = useState<SparkleEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const sparkIdRef = useRef(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const loadToken = useRef(0);

  useEffect(() => {
    fetch(buildUrl("image-sets/manifest.json"))
      .then((r) => {
        if (!r.ok) throw new Error("catalogue_unavailable");
        return r.json();
      })
      .then((data: ImageSet[]) => setAllSets(data))
      .catch(() => reportError("catalogue_unavailable"));
  }, []);

  const loadLevel = useCallback(
    async (sets: ImageSet[], lvl: number, selectedId?: string) => {
      if (sets.length === 0) return;
      const token = ++loadToken.current;
      setLoading(true);
      setHitmapData(null);
      setRevealedMarkers([]);
      setSparks([]);
      setMistakes(0);
      setHints(0);

      const set = selectedId
        ? sets.find((entry) => entry.id === selectedId)
        : sets[(lvl - 1) % sets.length];
      if (!set) { reportError("unknown_level"); return; }
      setImageSet(set);
      setLevel(lvl);

      try {
        const parsed = await parseHitmap(buildUrl(set.hitmap));
        if (token !== loadToken.current) return;
        if (parsed.zones.length === 0) throw new Error("empty_hitmap");
        setHitmapData(parsed);
      } catch {
        if (token !== loadToken.current) return;
        reportError("level_unavailable");
      }

      if (token === loadToken.current) setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (allSets.length > 0 && active) {
      loadLevel(allSets, 1, session?.levelIds[0]);
    }
    return () => { loadToken.current++; };
  }, [allSets, loadLevel, active, session]);

  const addSpark = useCallback((x: number, y: number, success: boolean) => {
    const id = ++sparkIdRef.current;
    setSparks((prev) => [...prev, { id, x, y, success }]);
    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => s.id !== id));
    }, 350);
  }, []);

  const handleTap = useCallback(
    (
      relX: number,
      relY: number,
      naturalW: number,
      naturalH: number,
      viewportX: number,
      viewportY: number
    ) => {
      if (loading || paused || !active || !hitmapData) return;
      const foundIds = new Set(revealedMarkers.map((m) => m.id));
      const hit = checkHit(relX, relY, naturalW, naturalH, hitmapData, foundIds);

      if (hit !== null) {
        addSpark(viewportX, viewportY, true);
        setRevealedMarkers((prev) => [
          ...prev,
          { id: hit, tapX: relX, tapY: relY, type: "found" },
        ]);
      } else {
        setMistakes((count) => count + 1);
        addSpark(viewportX, viewportY, false);
      }
    },
    [loading, paused, active, hitmapData, revealedMarkers, addSpark]
  );

  const handleHint = useCallback(() => {
    if (loading || paused || !active || !hitmapData) return;
    const foundIds = new Set(revealedMarkers.map((m) => m.id));
    const unrevealedZone = hitmapData.zones.find((z) => !foundIds.has(z.id));
    if (unrevealedZone) {
      setHints((count) => count + 1);
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
  }, [loading, paused, active, hitmapData, revealedMarkers]);

  const nextLevel = useCallback(() => {
    if (!active || paused) return;
    const next = level + 1;
    if (session && next > session.levelIds.length) return;
    loadLevel(allSets, next, session?.levelIds[next - 1]);
  }, [allSets, level, loadLevel, session, active, paused]);

  const zones = hitmapData?.zones ?? [];
  const allFound = zones.length > 0 && revealedMarkers.length >= zones.length;

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!allFound) {
      setShowSuccess(false);
      return;
    }
    if (paused) return;
    const t = setTimeout(() => setShowSuccess(true), 2000);
    return () => clearTimeout(t);
  }, [allFound, paused]);

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
    mistakes,
    hints,
    handleTap,
    handleHint,
    nextLevel,
  };
}
