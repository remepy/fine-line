/// <reference lib="webworker" />
import { parseHitmapPixels, type Zone } from "./hitmapCore";

export interface HitmapWorkerRequest {
  id: number;
  url: string;
}

export type HitmapWorkerResponse =
  | {
      id: number;
      ok: true;
      zones: Zone[];
      width: number;
      height: number;
      pixelZoneIds: Int16Array;
    }
  | { id: number; ok: false; error: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (event: MessageEvent<HitmapWorkerRequest>) => {
  const { id, url } = event.data;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`hitmap fetch failed: ${res.status}`);
    const bitmap = await createImageBitmap(await res.blob());

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const c2d = canvas.getContext("2d", { willReadFrequently: true });
    if (!c2d) throw new Error("no offscreen 2d context");
    c2d.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data, width, height } = c2d.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const parsed = parseHitmapPixels(data, width, height);

    const message: HitmapWorkerResponse = {
      id,
      ok: true,
      zones: parsed.zones,
      width: parsed.width,
      height: parsed.height,
      pixelZoneIds: parsed.pixelZoneIds,
    };
    // Hand the lookup table over rather than structured-cloning several MB.
    ctx.postMessage(message, [parsed.pixelZoneIds.buffer]);
  } catch (err) {
    const message: HitmapWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(message);
  }
});
