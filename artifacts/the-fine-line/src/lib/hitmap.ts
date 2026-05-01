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
  pixels: Uint8ClampedArray;
  /**
   * For every pixel index (y * width + x), the id of the zone that owns it,
   * or -1 if the pixel is background. This is the authoritative "which zone
   * does this pixel belong to" lookup — bounding boxes can overlap between
   * unrelated zones and must NEVER be used for this question.
   */
  pixelZoneIds: Int16Array;
}

// White/near-white = difference zone; everything else = background
function isWhite(r: number, g: number, b: number, a: number): boolean {
  return a >= 30 && r > 200 && g > 200 && b > 200;
}

export async function parseHitmap(hitmapUrl: string): Promise<HitmapData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas ctx"));
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;
      const visited = new Uint8Array(width * height);
      const pixelZoneIds = new Int16Array(width * height).fill(-1);
      const zones: Zone[] = [];
      let nextZoneId = 0;

      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        if (visited[i] || !isWhite(r, g, b, a)) continue;

        const queue: number[] = [i];
        const pixels: number[] = [];
        visited[i] = 1;
        const zoneId = nextZoneId;

        while (queue.length > 0) {
          const curr = queue.shift()!;
          pixels.push(curr);
          const x = curr % width;
          const y = Math.floor(curr / width);

          const neighbors = [
            x > 0 ? curr - 1 : -1,
            x < width - 1 ? curr + 1 : -1,
            y > 0 ? curr - width : -1,
            y < height - 1 ? curr + width : -1,
            x > 0 && y > 0 ? curr - width - 1 : -1,
            x < width - 1 && y > 0 ? curr - width + 1 : -1,
            x > 0 && y < height - 1 ? curr + width - 1 : -1,
            x < width - 1 && y < height - 1 ? curr + width + 1 : -1,
          ];

          for (const n of neighbors) {
            if (n < 0 || visited[n]) continue;
            const nr = data[n * 4];
            const ng = data[n * 4 + 1];
            const nb = data[n * 4 + 2];
            const na = data[n * 4 + 3];
            if (isWhite(nr, ng, nb, na)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }

        if (pixels.length < 4) continue;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let sumX = 0, sumY = 0;

        for (const p of pixels) {
          const px = p % width;
          const py = Math.floor(p / width);
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
          cx: sumX / pixels.length / width,
          cy: sumY / pixels.length / height,
          x1: minX / width,
          y1: minY / height,
          x2: maxX / width,
          y2: maxY / height,
          pixelCount: pixels.length,
        });
        nextZoneId++;
      }

      // Sort by size for marker color rotation, but keep zone.id stable so
      // pixelZoneIds remains a valid lookup.
      zones.sort((a, b) => b.pixelCount - a.pixelCount);

      resolve({ zones, width, height, pixels: data, pixelZoneIds });
    };
    img.onerror = (e) => reject(e);
    img.src = hitmapUrl;
  });
}

/**
 * Returns the zone id hit by the tap, or null.
 *
 * tapRelX/Y  – tap position as a fraction (0-1) of the displayed image size.
 * displayW/H – actual rendered pixel size of the image element.
 * screenTolerance – how many *display* pixels away from a white mask pixel
 *                   still counts as a hit (default 5).
 */
export function checkHit(
  tapRelX: number,
  tapRelY: number,
  displayW: number,
  displayH: number,
  hitmapData: HitmapData,
  foundIds: Set<number>,
  screenTolerance = 5
): number | null {
  const { width: hw, height: hh, pixelZoneIds } = hitmapData;

  // Convert display-space tolerance to hitmap-space pixels.
  const tolHX = screenTolerance * (hw / displayW);
  const tolHY = screenTolerance * (hh / displayH);

  // Tap position in hitmap pixels.
  const tapHX = tapRelX * hw;
  const tapHY = tapRelY * hh;

  const maxR = Math.ceil(Math.max(tolHX, tolHY));

  // Find the CLOSEST mask pixel to the tap (in display-space distance) and
  // return whichever zone actually owns it. This avoids any guesswork about
  // which zone "wins" when multiple zones have white pixels in the search
  // disc — the nearest mask pixel always wins.
  let bestZoneId = -1;
  let bestDist2 = Infinity;

  for (let dy = -maxR; dy <= maxR; dy++) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      // Elliptical check so the display-space tolerance is a real circle.
      const ndx = dx / tolHX;
      const ndy = dy / tolHY;
      const d2 = ndx * ndx + ndy * ndy;
      if (d2 > 1) continue;

      const px = Math.round(tapHX + dx);
      const py = Math.round(tapHY + dy);
      if (px < 0 || px >= hw || py < 0 || py >= hh) continue;

      const zoneId = pixelZoneIds[py * hw + px];
      if (zoneId < 0) continue;
      if (foundIds.has(zoneId)) continue;

      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestZoneId = zoneId;
      }
    }
  }

  return bestZoneId >= 0 ? bestZoneId : null;
}
