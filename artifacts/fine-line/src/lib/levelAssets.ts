import { parseHitmap, type HitmapData } from "./hitmap";

export interface LevelAssetSet {
  original: string;
  modified: string;
  hitmap: string;
}

/**
 * How many levels' worth of parsed hitmaps and decoded artwork to hold on to.
 * We only ever need the current level plus the one being prefetched, but a
 * little slack keeps a quick "back to the previous level" instant too. Each
 * entry retains a few MB, so this stays small on purpose.
 */
const MAX_CACHED_LEVELS = 3;

const hitmaps = new Map<string, HitmapData>();
const hitmapRequests = new Map<string, Promise<HitmapData>>();
/** Decoded <img> elements, held so the browser keeps them in its image cache. */
const images = new Map<string, HTMLImageElement>();
const imageRequests = new Map<string, Promise<void>>();

function evictOldest<T>(map: Map<string, T>, limit: number) {
  while (map.size > limit) {
    const oldest = map.keys().next();
    if (oldest.done) return;
    map.delete(oldest.value);
  }
}

function loadHitmap(url: string): Promise<HitmapData> {
  const cached = hitmaps.get(url);
  if (cached) return Promise.resolve(cached);

  const inFlight = hitmapRequests.get(url);
  if (inFlight) return inFlight;

  const request = parseHitmap(url)
    .then((data) => {
      hitmaps.set(url, data);
      evictOldest(hitmaps, MAX_CACHED_LEVELS);
      return data;
    })
    .finally(() => {
      hitmapRequests.delete(url);
    });

  hitmapRequests.set(url, request);
  return request;
}

function loadImage(url: string): Promise<void> {
  if (images.has(url)) return Promise.resolve();

  const inFlight = imageRequests.get(url);
  if (inFlight) return inFlight;

  const request = new Promise<void>((resolve) => {
    const img = new Image();
    // Resolve on error too: a missing picture should not wedge the level
    // behind a spinner forever.
    const done = () => {
      images.set(url, img);
      // Artwork is the heaviest thing we retain, so keep both halves of the
      // current and prefetched levels and nothing more.
      evictOldest(images, MAX_CACHED_LEVELS * 2);
      resolve();
    };
    img.onload = () => {
      // decode() keeps the first paint off the main thread; if the browser
      // does not support it we just proceed.
      const decoded = img.decode?.();
      if (decoded) decoded.then(done, done);
      else done();
    };
    img.onerror = done;
    img.src = url;
  }).finally(() => {
    imageRequests.delete(url);
  });

  imageRequests.set(url, request);
  return request;
}

/**
 * Fetches everything a level needs. Resolves once the artwork is decoded and
 * ready to paint AND the hitmap is parsed, so the spinner is replaced by a
 * playable level rather than by two blank image frames.
 */
export async function loadLevelAssets(
  set: LevelAssetSet,
): Promise<HitmapData> {
  const [hitmap] = await Promise.all([
    loadHitmap(set.hitmap),
    loadImage(set.original),
    loadImage(set.modified),
  ]);
  return hitmap;
}

/**
 * Warms the cache for a level the player has not reached yet. Fire and forget:
 * failures here are irrelevant, the real load will surface them.
 */
export function prefetchLevelAssets(set: LevelAssetSet): void {
  loadLevelAssets(set).catch(() => {});
}

/** True when the level can be shown without any network work. */
export function isLevelReady(set: LevelAssetSet): boolean {
  return (
    hitmaps.has(set.hitmap) &&
    images.has(set.original) &&
    images.has(set.modified)
  );
}
