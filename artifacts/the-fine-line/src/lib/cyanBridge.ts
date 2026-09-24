export const GAME_ID = "the-fine-line";
export const PROTOCOL_VERSION = 1;

export interface BridgeSession {
  protocolVersion: 1;
  sessionId: string;
  levelIds: string[];
  reducedMotion: boolean;
  tutorialSeen: boolean;
}
import { getLanguage } from "./copy.ts";

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
  generation++;
  update({ status: "ended", paused: true, endReason: "error" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSession(value: unknown): BridgeSession {
  if (!isRecord(value) || value.protocolVersion !== PROTOCOL_VERSION ||
      typeof value.sessionId !== "string" || !value.sessionId ||
      !Array.isArray(value.levelIds) || value.levelIds.length === 0 ||
      !value.levelIds.every((id) => typeof id === "string" && !!id) ||
      typeof value.reducedMotion !== "boolean" ||
      typeof value.tutorialSeen !== "boolean" ||
      typeof value.expectedLocale !== "string") {
    throw new Error("invalid_session");
  }
  if (value.expectedLocale !== getLanguage().locale) {
    throw new Error("locale_mismatch");
  }
  return {
    protocolVersion: 1,
    sessionId: value.sessionId,
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
      try {
        const session = parseSession(message.data);
        completedRounds = 0;
        update({ status: "active", session });
      } catch (error) {
        fail(error instanceof Error && error.message === "locale_mismatch"
          ? "locale_mismatch" : "invalid_session");
      }
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
  post("game_ready", {
    gameId: GAME_ID, protocolVersion: PROTOCOL_VERSION, locale: getLanguage().locale,
  });
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