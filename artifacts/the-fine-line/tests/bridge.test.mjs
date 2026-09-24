import test from "node:test";
import assert from "node:assert/strict";

async function freshBridge(host) {
  globalThis.window = host ? { CyanGameBridge: host } : {};
  return import(`../src/lib/cyanBridge.ts?case=${Math.random()}`);
}

function startData(levelIds = ["walk-in-park", "seaside-terrace"]) {
  return {
    protocolVersion: 1,
    sessionId: "opaque-session",
    locale: "en-US",
    translations: {},
    levelIds,
    reducedMotion: true,
    tutorialSeen: true,
  };
}

test("standalone does not post messages or wait for the app", async () => {
  const bridge = await freshBridge();
  bridge.startBridge();
  assert.equal(bridge.getBridgeState().status, "standalone");
  assert.equal(window.cyanBridge, undefined);
});

test("ready precedes session, ordered rounds finish exactly once", async () => {
  const messages = [];
  const bridge = await freshBridge({
    postMessage(raw) {
      const message = JSON.parse(raw);
      messages.push(message);
      if (message.type === "game_ready") {
        assert.equal(typeof window.cyanBridge.receive, "function");
        window.cyanBridge.receive({ type: "session_start", data: startData() });
      }
    },
  });
  bridge.startBridge();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(bridge.getBridgeState().status, "active");
  assert.equal(bridge.getBridgeState().session.locale, "en-US");
  assert.equal(messages[0].data.gameId, "the-fine-line");

  window.cyanBridge.receive({ type: "pause" });
  bridge.reportRound(1, "walk-in-park", { differencesFound: 7 });
  assert.equal(messages.length, 1, "no completion while paused");
  window.cyanBridge.receive({ type: "resume" });
  bridge.reportRound(2, "seaside-terrace", { differencesFound: 7 });
  bridge.reportRound(1, "walk-in-park", { differencesFound: 7 });
  bridge.reportRound(1, "walk-in-park", { differencesFound: 7 });
  bridge.finishGame(2, "seaside-terrace", { differencesFound: 7 });
  assert.equal(messages.length, 2, "finishing early is ignored");
  bridge.reportRound(2, "seaside-terrace", { differencesFound: 7 });
  bridge.finishGame(2, "seaside-terrace", { differencesFound: 7 });
  bridge.reportRound(1, "walk-in-park", { differencesFound: 7 });
  assert.deepEqual(messages.map((m) => m.type), [
    "game_ready", "level_completed", "level_completed", "game_finished",
  ]);
  assert.equal(messages[3].data.lastCompletedLevelId, "seaside-terrace");
  assert.equal(bridge.getBridgeState().endReason, "finished");
});

test("abort stops output and unknown locale falls back to Hebrew", async () => {
  const messages = [];
  const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
  bridge.startBridge();
  window.cyanBridge.receive({
    type: "session_start",
    data: { ...startData(), locale: "fr-FR" },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(bridge.getBridgeState().session.locale, "he-IL");
  window.cyanBridge.receive({ type: "abort", data: { reason: "interrupted" } });
  bridge.reportRound(1, "walk-in-park", {});
  assert.deepEqual(messages.map((m) => m.type), ["game_ready"]);
  assert.equal(bridge.getBridgeState().endReason, "aborted");
});

test("missing session fails closed after five seconds", async () => {
  const messages = [];
  const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
  bridge.startBridge();
  await new Promise((resolve) => setTimeout(resolve, 5100));
  assert.deepEqual(messages.map((m) => m.type), ["game_ready", "game_error"]);
  assert.equal(bridge.getBridgeState().endReason, "error");
});

test("stalled translation URL fails closed after session_start", async () => {
  const previousFetch = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      aborted = true;
      reject(new Error("aborted"));
    });
  });
  try {
    const messages = [];
    const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
    bridge.startBridge();
    window.cyanBridge.receive({
      type: "session_start",
      data: { ...startData(), translations: "https://example.invalid/translations.json" },
    });
    await new Promise((resolve) => setTimeout(resolve, 5100));
    assert.equal(aborted, true);
    assert.deepEqual(messages.map((m) => m.type), ["game_ready", "game_error"]);
    assert.equal(bridge.getBridgeState().endReason, "error");
  } finally {
    globalThis.fetch = previousFetch;
  }
});