import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { createHomeGlimm } from "./home-glimm.mjs";

function environment({ reduced = false, hidden = false, desktop = true, fail = false } = {}) {
  const document = Object.assign(new EventTarget(), { readyState: "loading", hidden });
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const desktopPointer = Object.assign(new EventTarget(), { matches: desktop });
  const timers = [];
  const idle = [];
  const window = Object.assign(new EventTarget(), { requestIdleCallback: (callback) => idle.push(callback) });
  let loads = 0;
  let shaders = 0;
  let canvases = 0;
  document.body = { append() {} };
  document.createElement = () => {
    canvases += 1;
    return Object.assign(new EventTarget(), { setAttribute() {}, getContext() {}, remove() {} });
  };
  const controller = vm.runInNewContext(`(${createHomeGlimm.toString()})(load)`, {
    document, window, matchMedia: (query) => query.includes("prefers-reduced-motion") ? motion : desktopPointer,
    setTimeout: (callback) => timers.push(callback),
    load: async () => {
      loads += 1;
      if (fail) throw new Error("Network unavailable");
      return { createShader() { shaders += 1; return null; } };
    },
  });
  return { controller, document, window, motion, desktopPointer, timers, idle, loads: () => loads, shaders: () => shaders, canvases: () => canvases };
}

test("mobile navigation does not download or create the glimmer", async () => {
  const env = environment({ desktop: false });
  env.document.readyState = "complete";
  env.window.dispatchEvent(new Event("load"));
  env.timers.splice(0).forEach((callback) => callback());
  env.idle.splice(0).forEach((callback) => callback());
  await Promise.resolve();
  assert.equal(env.loads(), 0);
  let navigations = 0;
  await env.controller.run(() => navigations++);
  assert.equal(navigations, 1);
  assert.equal(env.canvases(), 0);
});

test("switching to mobile bypasses an already loaded glimmer", async () => {
  const env = environment();
  env.document.readyState = "complete";
  env.window.dispatchEvent(new Event("load"));
  env.timers.splice(0).forEach((callback) => callback());
  env.idle.splice(0).forEach((callback) => callback());
  await Promise.resolve();
  assert.equal(env.loads(), 1);
  env.desktopPointer.matches = false;
  env.desktopPointer.dispatchEvent(new Event("change"));
  let navigations = 0;
  await env.controller.run(() => navigations++);
  assert.equal(navigations, 1);
  assert.equal(env.canvases(), 0);
});

test("glimmer downloads after page load and idle without pointer intent or GPU work", async () => {
  const env = environment();
  assert.equal(env.loads(), 0);
  assert.equal(env.timers.length, 0);
  let navigations = 0;
  await env.controller.run(() => navigations++);
  assert.equal(navigations, 1, "an early navigation must not wait for the effect");
  env.document.readyState = "complete";
  env.window.dispatchEvent(new Event("load"));
  env.timers.splice(0).forEach((callback) => callback());
  assert.equal(env.loads(), 0, "page load alone must not compete for the main thread");
  env.idle.splice(0).forEach((callback) => callback());
  await Promise.resolve();
  assert.equal(env.loads(), 1);
  env.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(env.timers.length, 0);
  assert.equal(env.loads(), 1, "reuse the background import");
  assert.equal(env.shaders(), 0, "preloading must not create a GPU context");
});

test("hidden and reduced-motion pages defer the optional download until eligible", async () => {
  const env = environment({ reduced: true, hidden: true });
  env.document.readyState = "complete";
  env.window.dispatchEvent(new Event("load"));
  assert.equal(env.timers.length, 0);
  env.motion.matches = false;
  env.motion.dispatchEvent(new Event("change"));
  assert.equal(env.timers.length, 0);
  env.document.hidden = false;
  env.document.dispatchEvent(new Event("visibilitychange"));
  env.timers.splice(0).forEach((callback) => callback());
  env.idle.splice(0).forEach((callback) => callback());
  await Promise.resolve();
  assert.equal(env.loads(), 1);
});

test("an optional glimmer download failure never blocks navigation", async () => {
  const env = environment({ fail: true });
  env.document.readyState = "complete";
  env.window.dispatchEvent(new Event("load"));
  env.timers.splice(0).forEach((callback) => callback());
  env.idle.splice(0).forEach((callback) => callback());
  await Promise.resolve();
  let navigations = 0;
  await env.controller.run(() => navigations++);
  assert.equal(navigations, 1);
});
