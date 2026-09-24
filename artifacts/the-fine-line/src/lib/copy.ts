// Translation data is loaded from the page's own translations.json before
// React mounts or game_ready is sent. There are deliberately no copy fallbacks.
export const copyKeys = [
  "title", "loading", "original", "modified", "differences",
  "hint", "musicOn", "musicOff", "quit",
  "success", "complete", "next", "instruction1", "instruction2",
  "instruction3", "start", "rotate", "paused",
  "unavailable", "addToHomeBeforeShare", "addToHomeAfterShare",
  "share", "dismiss", "appDescription",
] as const;

export type CopyKey = typeof copyKeys[number];
export type Language = {
  locale: "he-IL" | "en-US";
  dir: "rtl" | "ltr";
  keys: Record<CopyKey, string>;
};

let language: Language | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function loadLanguage(): Promise<Language> {
  language = null;
  // A relative URL is essential: this must work at each language's own prefix.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let value: unknown;
  try {
    const response = await fetch("./translations.json", {
      cache: "no-cache", signal: controller.signal,
    });
    if (!response.ok) throw new Error("translations_unavailable");
    value = await response.json();
  } finally {
    clearTimeout(timeout);
  }
  const keys = isRecord(value) ? value.keys : null;
  if (!isRecord(value) ||
      (value.locale !== "he-IL" && value.locale !== "en-US") ||
      (value.dir !== "rtl" && value.dir !== "ltr") ||
      !isRecord(keys) ||
      !copyKeys.every((key) => typeof keys[key] === "string" &&
        (keys[key] as string).trim().length > 0)) {
    throw new Error("translations_unavailable");
  }
  language = value as unknown as Language;
  return language;
}

export function getLanguage(): Language {
  if (!language) throw new Error("translations_unavailable");
  return language;
}

export function copy(_session: unknown, key: CopyKey, n?: number): string {
  return getLanguage().keys[key].replace(/\{n\}/g, String(n ?? ""));
}