export const GAME_ID = "the-fine-line";
export const PROTOCOL_VERSION = 1;

export interface BridgeSession {
  protocolVersion: 1;
  sessionId: string;
  locale: "he-IL" | "en-US";
  translations: Record<string, string>;
  levelIds: string[];
  reducedMotion: boolean;
  tutorialSeen: boolean;
}

export type BridgeState = {
  embedded: boolean;
  status: "standalone" | "waiting" | "active" | "ended";
  session: BridgeSession | null;
  paused: boolean;
  endReason?: "finished" | "quit" | "aborted" | "error";
};

type Host = { postMessage(message: string): void };

declare global {
  interface Window {
    CyanGameBridge?: Host;
    cyanBridge?: { receive(message: unknown): void };
  }
}

const host = window.CyanGameBridge;
let state: BridgeState = {
  embedded: !!host,
  status: host ? "waiting" : "standalone",
  session: null,
  paused: false,
};
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
let generation = 0;
let acceptingSession = true;
let completedRounds = 0;
let sessionRequestController: AbortController | undefined;

function update(next: Partial<BridgeState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function post(type: string, data?: object) {
  if (!host || state.status === "ended") return;
  host.postMessage(JSON.stringify(data === undefined ? { type } : { type, data }));
}

function fail(code: string) {
  if (state.status === "ended") return;
  post("game_error", { code, message: code });
  clearTimeout(timer);
  sessionRequestController?.abort();
  generation++;
  update({ status: "ended", paused: true, endReason: "error" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseSession(value: unknown, signal: AbortSignal): Promise<BridgeSession> {
  if (!isRecord(value) || value.protocolVersion !== PROTOCOL_VERSION ||
      typeof value.sessionId !== "string" || !value.sessionId ||
      !Array.isArray(value.levelIds) || value.levelIds.length === 0 ||
      !value.levelIds.every((id) => typeof id === "string" && !!id) ||
      typeof value.reducedMotion !== "boolean" ||
      typeof value.tutorialSeen !== "boolean") {
    throw new Error("invalid_session");
  }
  let translations: unknown = value.translations;
  if (typeof translations === "string") {
    // A translation URL is supported, but the host must configure CORS for
    // cross-origin resources. No untrusted text is inserted as HTML.
    const response = await fetch(translations, { signal });
    if (!response.ok) throw new Error("translations_unavailable");
    translations = await response.json();
  }
  if (!isRecord(translations) ||
      !Object.values(translations).every((v) => typeof v === "string")) {
    throw new Error("invalid_translations");
  }
  return {
    protocolVersion: 1,
    sessionId: value.sessionId,
    locale: value.locale === "en-US" ? "en-US" : "he-IL",
    translations: translations as Record<string, string>,
    levelIds: value.levelIds as string[],
    reducedMotion: value.reducedMotion,
    tutorialSeen: value.tutorialSeen,
  };
}

function receive(message: unknown) {
  if (!host || !isRecord(message) || typeof message.type !== "string") return;
  switch (message.type) {
    case "session_start": {
      if (state.status !== "waiting" || !acceptingSession) return;
      acceptingSession = false;
      clearTimeout(timer);
      const request = ++generation;
      sessionRequestController = new AbortController();
      timer = setTimeout(() => {
        if (generation === request && state.status === "waiting") fail("session_timeout");
      }, 5000);
      void parseSession(message.data, sessionRequestController.signal).then((session) => {
        if (generation === request && state.status === "waiting") {
          clearTimeout(timer);
          sessionRequestController = undefined;
          completedRounds = 0;
          update({ status: "active", session });
        }
      }).catch(() => {
        if (generation === request) fail("invalid_session");
      });
      return;
    }
    case "pause":
      if (state.status === "active") update({ paused: true });
      return;
    case "resume":
      if (state.status === "active") update({ paused: false });
      return;
    case "abort":
      clearTimeout(timer);
      sessionRequestController?.abort();
      generation++;
      update({ status: "ended", paused: true, endReason: "aborted" });
      return;
  }
}

export function startBridge() {
  if (!host) return;
  // Defined before game_ready; hosts can synchronously send session_start.
  window.cyanBridge = { receive };
  timer = setTimeout(() => {
    if (state.status === "waiting" && acceptingSession) fail("session_timeout");
  }, 5000);
  post("game_ready", { gameId: GAME_ID, protocolVersion: PROTOCOL_VERSION });
}

export function getBridgeState() { return state; }
export function subscribeBridge(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function reportRound(round: number, levelId: string, stats: Record<string, number>) {
  if (state.status !== "active" || state.paused ||
      round !== completedRounds + 1 || state.session?.levelIds[round - 1] !== levelId) return;
  completedRounds = round;
  post("level_completed", { levelId, outcome: "won", stats });
}

export function finishGame(round: number, levelId: string, stats: Record<string, number>) {
  if (state.status !== "active" || state.paused ||
      completedRounds !== state.session?.levelIds.length ||
      round !== completedRounds || state.session.levelIds[round - 1] !== levelId) return;
  post("game_finished", { lastCompletedLevelId: levelId, stats });
  update({ status: "ended", paused: true, endReason: "finished" });
}

export function requestExit() {
  if (!host) { window.close(); return; }
  if (state.status !== "active") return;
  post("game_exit_requested");
  update({ status: "ended", paused: true, endReason: "quit" });
}

export function reportError(code: string) {
  if (host) fail(code);
}