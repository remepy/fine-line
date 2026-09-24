export interface Zone {
  id: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pixelCount: number;
}

export interface HitmapData {
  zones: Zone[];
  width: number;
  height: number;
  /**
   * For every pixel index (y * width + x), the id of the zone that owns it,
   * or -1 if the pixel is background. This is the authoritative "which zone
   * does this pixel belong to" lookup — bounding boxes can overlap between
   * unrelated zones and must NEVER be used for this question.
   */
  pixelZoneIds: Int16Array;
}

/** A zone must be at least this many pixels to count; smaller blobs are noise. */
const MIN_ZONE_PIXELS = 4;

// White/near-white = difference zone; everything else = background
function isWhite(r: number, g: number, b: number, a: number): boolean {
  return a >= 30 && r > 200 && g > 200 && b > 200;
}

/**
 * Finds the difference zones in a decoded hitmap: 8-neighbour connected
 * components of white pixels.
 *
 * This is deliberately free of any DOM dependency so it can run inside a
 * worker (see hitmap.worker.ts) as well as on the main thread.
 *
 * The pixel semantics here are load-bearing and must not drift: the white
 * test above and the 8-neighbour connectivity below determine how many
 * differences each level has.
 */
export function parseHitmapPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): HitmapData {
  const total = width * height;

  // Resolve the white test once per pixel instead of re-reading four channel
  // bytes every time a pixel is visited as someone's neighbour.
  const white = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const o = i * 4;
    if (isWhite(data[o], data[o + 1], data[o + 2], data[o + 3])) white[i] = 1;
  }

  const visited = new Uint8Array(total);
  const pixelZoneIds = new Int16Array(total).fill(-1);

  // One flood-fill queue reused for the whole image. Each component occupies
  // the slice [start, tail) once its fill completes, which doubles as that
  // component's pixel list — no per-zone array allocation, and no Array#shift
  // (which is O(n) per pop and made large zones quadratic).
  const queue = new Int32Array(total);
  const zones: Zone[] = [];
  let nextZoneId = 0;

  for (let seed = 0; seed < total; seed++) {
    if (visited[seed] || !white[seed]) continue;

    const start = 0;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    visited[seed] = 1;
    const zoneId = nextZoneId;

    while (head < tail) {
      const curr = queue[head++];
      const x = curr % width;
      const y = (curr / width) | 0;

      const hasLeft = x > 0;
      const hasRight = x < width - 1;
      const hasUp = y > 0;
      const hasDown = y < height - 1;

      if (hasLeft) {
        const n = curr - 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasRight) {
        const n = curr + 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasUp) {
        const n = curr - width;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasDown) {
        const n = curr + width;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasLeft && hasUp) {
        const n = curr - width - 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasRight && hasUp) {
        const n = curr - width + 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasLeft && hasDown) {
        const n = curr + width - 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
      if (hasRight && hasDown) {
        const n = curr + width + 1;
        if (!visited[n] && white[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
    }

    const pixelCount = tail - start;
    // Noise blob: skipped without consuming a zone id, so ids stay dense.
    if (pixelCount < MIN_ZONE_PIXELS) continue;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let sumX = 0;
    let sumY = 0;

    for (let k = start; k < tail; k++) {
      const p = queue[k];
      const px = p % width;
      const py = (p / width) | 0;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      sumX += px;
      sumY += py;
      pixelZoneIds[p] = zoneId;
    }

    zones.push({
      id: zoneId,
      cx: sumX / pixelCount / width,
      cy: sumY / pixelCount / height,
      x1: minX / width,
      y1: minY / height,
      x2: maxX / width,
      y2: maxY / height,
      pixelCount,
    });
    nextZoneId++;
  }

  // Sort by size for marker color rotation, but keep zone.id stable so
  // pixelZoneIds remains a valid lookup.
  zones.sort((a, b) => b.pixelCount - a.pixelCount);

  return { zones, width, height, pixelZoneIds };
}
