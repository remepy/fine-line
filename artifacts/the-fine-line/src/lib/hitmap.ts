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

// In the hitmap, white/bright regions mark differences; everything else is background.
function isBackground(r: number, g: number, b: number, a: number): boolean {
  if (a < 30) return true;
  // A pixel is a difference zone only if it's bright white/near-white
  if (r > 200 && g > 200 && b > 200) return false;
  return true;
}

export async function parseHitmap(hitmapUrl: string): Promise<Zone[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas ctx"));
      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const visited = new Uint8Array(width * height);
      const zones: Zone[] = [];

      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        if (visited[i] || isBackground(r, g, b, a)) continue;

        const queue: number[] = [i];
        const pixels: number[] = [];
        visited[i] = 1;

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
            if (!isBackground(nr, ng, nb, na)) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }

        if (pixels.length < 4) continue;

        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        let sumX = 0,
          sumY = 0;

        for (const p of pixels) {
          const px = p % width;
          const py = Math.floor(p / width);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
          sumX += px;
          sumY += py;
        }

        zones.push({
          id: zones.length,
          cx: sumX / pixels.length / width,
          cy: sumY / pixels.length / height,
          x1: minX / width,
          y1: minY / height,
          x2: maxX / width,
          y2: maxY / height,
          pixelCount: pixels.length,
        });
      }

      zones.sort((a, b) => b.pixelCount - a.pixelCount);
      resolve(zones);
    };
    img.onerror = (e) => reject(e);
    img.src = hitmapUrl;
  });
}

export function checkHit(
  tapX: number,
  tapY: number,
  zones: Zone[],
  foundIds: Set<number>,
  tolerance = 0.02
): number | null {
  let bestId: number | null = null;
  let bestDist = Infinity;

  for (const zone of zones) {
    if (foundIds.has(zone.id)) continue;

    const x1 = zone.x1 - tolerance;
    const y1 = zone.y1 - tolerance;
    const x2 = zone.x2 + tolerance;
    const y2 = zone.y2 + tolerance;

    if (tapX >= x1 && tapX <= x2 && tapY >= y1 && tapY <= y2) {
      const dist =
        Math.abs(tapX - zone.cx) * Math.abs(tapX - zone.cx) +
        Math.abs(tapY - zone.cy) * Math.abs(tapY - zone.cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = zone.id;
      }
    }
  }

  return bestId;
}
