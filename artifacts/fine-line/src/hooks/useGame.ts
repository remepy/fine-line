import { useState, useEffect, useCallback, useRef } from "react";
import type { BridgeSession } from "../lib/cyanBridge";
import { reportError } from "../lib/cyanBridge";
import { HitmapData, checkHit } from "../lib/hitmap";
import {
  isLevelReady,
  loadLevelAssets,
  prefetchLevelAssets,
  type LevelAssetSet,
} from "../lib/levelAssets";

export interface ImageSet {
  /** Catalogue ID the app addresses this level by, e.g. "fine-line-001". */
  id: string;
  /** Artwork folder name, kept for readability in the manifest and asset paths. */
  slug: string;
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

/**
 * Rounds played when no app session is present (BR-09). In a real session the
 * app decides the count by the length of session.levelIds; this only governs
 * QA opening the URL in a browser.
 */
export const STANDALONE_ROUNDS = 3;

function buildUrl(path: string) {
  return `${BASE}${path}`;
}

function assetUrls(set: ImageSet): LevelAssetSet {
  return {
    original: buildUrl(set.original),
    modified: buildUrl(set.modified),
    hitmap: buildUrl(set.hitmap),
  };
}

/**
 * Which set a level maps to. A bridge session names its levels explicitly;
 * standalone play just cycles through the catalogue.
 */
function pickSet(
  sets: ImageSet[],
  lvl: number,
  selectedId?: string
): ImageSet | undefined {
  return selectedId
    ? sets.find((entry) => entry.id === selectedId)
    : sets[(lvl - 1) % sets.length];
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
  const [taps, setTaps] = useState(0);
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

      const set = pickSet(sets, lvl, selectedId);
      if (!set) { reportError("unknown_level"); return; }
      const urls = assetUrls(set);

      setHitmapData(null);
      setRevealedMarkers([]);
      setSparks([]);
      setTaps(0);
      setMistakes(0);
      setHints(0);
      setImageSet(set);
      setLevel(lvl);
      // A prefetched level has nothing left to wait for, so skip the spinner
      // rather than flashing it for a frame.
      setLoading(!isLevelReady(urls));

      try {
        const parsed = await loadLevelAssets(urls);
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

  // Pull the next level down in the background while this one is played, so
  // advancing feels instant. Runs once the current level has settled so it
  // never competes with it for bandwidth.
  useEffect(() => {
    if (loading || !active || allSets.length === 0) return;
    const next = level + 1;
    if (next > (session ? session.levelIds.length : STANDALONE_ROUNDS)) return;
    const nextSet = pickSet(allSets, next, session?.levelIds[next - 1]);
    if (nextSet) prefetchLevelAssets(assetUrls(nextSet));
  }, [allSets, level, loading, active, session]);

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

      // Every tap that reaches the board counts, hit or miss, so wrongTaps
      // can be read as a share of totalTaps rather than in isolation.
      setTaps((count) => count + 1);

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
    if (next > (session ? session.levelIds.length : STANDALONE_ROUNDS)) return;
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
  const totalRounds = session ? session.levelIds.length : STANDALONE_ROUNDS;

  return {
    level,
    totalRounds,
    hasNextRound: level < totalRounds,
    imageSet,
    zones,
    revealedMarkers,
    sparks,
    loading,
    allFound,
    showSuccess,
    hintsLeft,
    totalSets: allSets.length,
    taps,
    mistakes,
    hints,
    handleTap,
    handleHint,
    nextLevel,
  };
}
