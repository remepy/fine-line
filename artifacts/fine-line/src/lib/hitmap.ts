import { parseHitmapPixels, type HitmapData, type Zone } from "./hitmapCore";
import type {
  HitmapWorkerRequest,
  HitmapWorkerResponse,
} from "./hitmap.worker";

export type { HitmapData, Zone };

/**
 * Hitmaps are ~1-4 megapixels, so decoding and flood-filling them on the main
 * thread stalls the UI for hundreds of milliseconds. We do the work in a
 * worker and only fall back to the main thread if workers or OffscreenCanvas
 * are unavailable.
 */
let workerHandle: Worker | null = null;
let workerUnavailable = false;
let nextRequestId = 0;
const pending = new Map<
  number,
  { resolve: (d: HitmapData) => void; reject: (e: unknown) => void }
>();

function getWorker(): Worker | null {
  if (workerUnavailable) return null;
  if (workerHandle) return workerHandle;

  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    workerUnavailable = true;
    return null;
  }

  try {
    const worker = new Worker(new URL("./hitmap.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.addEventListener(
      "message",
      (event: MessageEvent<HitmapWorkerResponse>) => {
        const msg = event.data;
        const entry = pending.get(msg.id);
        if (!entry) return;
        pending.delete(msg.id);
        if (msg.ok) {
          entry.resolve({
            zones: msg.zones,
            width: msg.width,
            height: msg.height,
            pixelZoneIds: msg.pixelZoneIds,
          });
        } else {
          entry.reject(new Error(msg.error));
        }
      },
    );

    worker.addEventListener("error", (event) => {
      // The worker is dead; fail everything queued on it and never use it
      // again, so later calls transparently take the main-thread path.
      const err = new Error(event.message || "hitmap worker error");
      for (const entry of pending.values()) entry.reject(err);
      pending.clear();
      workerUnavailable = true;
      workerHandle = null;
      worker.terminate();
    });

    workerHandle = worker;
    return worker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

function parseInWorker(
  worker: Worker,
  hitmapUrl: string,
): Promise<HitmapData> {
  return new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    pending.set(id, { resolve, reject });
    const request: HitmapWorkerRequest = { id, url: hitmapUrl };
    worker.postMessage(request);
  });
}

function parseOnMainThread(hitmapUrl: string): Promise<HitmapData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("no canvas ctx"));
      ctx.drawImage(img, 0, 0);

      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      resolve(parseHitmapPixels(data, width, height));
    };
    img.onerror = (e) => reject(e);
    img.src = hitmapUrl;
  });
}

export async function parseHitmap(hitmapUrl: string): Promise<HitmapData> {
  const worker = getWorker();
  if (worker) {
    try {
      return await parseInWorker(worker, hitmapUrl);
    } catch (err) {
      // A genuine 404 should surface, but if the worker itself fell over we
      // still want the level to load.
      if (!workerUnavailable) throw err;
    }
  }
  console.debug("hitmap: worker unavailable, parsing on the main thread");
  return parseOnMainThread(hitmapUrl);
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
