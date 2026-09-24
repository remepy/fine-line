import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadLanguage, getLanguage, copy } from "../src/lib/copy.ts";

const he = JSON.parse(await readFile(new URL("../public/translations.json", import.meta.url)));
const en = JSON.parse(await readFile(new URL("../translations/en.json", import.meta.url)));

async function freshBridge(host) {
  globalThis.window = host ? { CyanGameBridge: host } : {};
  return import(`../src/lib/cyanBridge.ts?case=${Math.random()}`);
}

async function useLanguage(data) {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "./translations.json");
    assert.equal(options.cache, "no-cache");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => data };
  };
  try { return await loadLanguage(); }
  finally { globalThis.fetch = previous; }
}

function startData(levelIds = ["walk-in-park", "seaside-terrace"]) {
  return {
    protocolVersion: 1,
    sessionId: "opaque-session",
    expectedLocale: getLanguage().locale,
    levelIds,
    reducedMotion: true,
    tutorialSeen: true,
  };
}

test("both language files provide all copy, locale and direction", async () => {
  await useLanguage(he);
  assert.equal(getLanguage().dir, "rtl");
  assert.equal(copy(null, "title"), "הקו הדק");
  await useLanguage(en);
  assert.equal(getLanguage().dir, "ltr");
  assert.equal(copy(null, "title"), "The Fine Line");
  assert.equal(copy(null, "level", 4), "Level 4");
});

test("standalone waits for copy and posts nothing", async () => {
  await useLanguage(he);
  const bridge = await freshBridge();
  bridge.startBridge();
  assert.equal(bridge.getBridgeState().status, "standalone");
  assert.equal(window.cyanBridge, undefined);
});

test("ready includes loaded locale, then ordered rounds finish exactly once", async () => {
  await useLanguage(en);
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
  assert.equal(bridge.getBridgeState().status, "active");
  assert.deepEqual(messages[0].data, {
    gameId: "the-fine-line", protocolVersion: 1, locale: "en-US",
  });

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
});

test("locale mismatch fails closed; no gameplay and no leaked message", async () => {
  await useLanguage(he);
  const messages = [];
  const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
  bridge.startBridge();
  window.cyanBridge.receive({
    type: "session_start", data: { ...startData(), expectedLocale: "en-US" },
  });
  assert.deepEqual(messages.map((m) => m.type), ["game_ready", "game_error"]);
  assert.equal(messages[1].data.code, "locale_mismatch");
  assert.equal(bridge.getBridgeState().status, "ended");
  bridge.reportRound(1, "walk-in-park", {});
  assert.equal(messages.length, 2);
});

test("abort stops output", async () => {
  await useLanguage(he);
  const messages = [];
  const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
  bridge.startBridge();
  window.cyanBridge.receive({ type: "session_start", data: startData() });
  window.cyanBridge.receive({ type: "abort", data: { reason: "interrupted" } });
  bridge.reportRound(1, "walk-in-park", {});
  assert.deepEqual(messages.map((m) => m.type), ["game_ready"]);
  assert.equal(bridge.getBridgeState().endReason, "aborted");
});

test("missing session fails closed after five seconds", async () => {
  await useLanguage(he);
  const messages = [];
  const bridge = await freshBridge({ postMessage: (raw) => messages.push(JSON.parse(raw)) });
  bridge.startBridge();
  await new Promise((resolve) => setTimeout(resolve, 5100));
  assert.deepEqual(messages.map((m) => m.type), ["game_ready", "game_error"]);
  assert.equal(bridge.getBridgeState().endReason, "error");
});

test("missing or invalid copy cannot be shown or followed by game_ready", async () => {
  const bridgeMessages = [];
  const bridge = await freshBridge({
    postMessage: (raw) => bridgeMessages.push(JSON.parse(raw)),
  });
  for (const data of [{ ...he, keys: { title: "partial" } }, { ...he, dir: "invalid" }]) {
    await assert.rejects(useLanguage(data), /translations_unavailable/);
    assert.throws(() => copy(null, "title"), /translations_unavailable/);
  }
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(url, "./translations.json");
    return { ok: false, status: 404 };
  };
  try {
    await assert.rejects(loadLanguage(), /translations_unavailable/);
  } finally {
    globalThis.fetch = previous;
  }
  bridge.reportError("translations_unavailable");
  assert.deepEqual(bridgeMessages.map((m) => m.type), ["game_error"]);
  assert.equal(bridgeMessages[0].data.code, "translations_unavailable");
});

test("unresponsive translation file is aborted before gameplay starts", async () => {
  const previous = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = (url, { signal }) => {
    assert.equal(url, "./translations.json");
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => {
        aborted = true;
        reject(new Error("request aborted"));
      });
    });
  };
  try {
    await assert.rejects(loadLanguage());
    assert.equal(aborted, true);
    assert.throws(() => copy(null, "title"), /translations_unavailable/);
  } finally {
    globalThis.fetch = previous;
  }
});