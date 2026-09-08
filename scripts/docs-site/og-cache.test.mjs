import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { renderPageOgSvg } from "./og-card-template.mjs";
import { fixture, write } from "./test-helpers/redirect-fixture.mjs";

test("OG cache restores exact PNGs, invalidates render inputs and repairs damaged entries", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-og-cache-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "scripts/docs-site");
  fs.mkdirSync(source, { recursive: true });
  for (const name of ["og-cache.mjs", "og-render-worker.mjs", "fonts"]) {
    fs.cpSync(new URL(name, import.meta.url), path.join(source, name), { recursive: true });
  }
  fs.copyFileSync(new URL("../../package-lock.json", import.meta.url), path.join(root, "package-lock.json"));
  fs.symlinkSync(fileURLToPath(new URL("../../node_modules", import.meta.url)), path.join(root, "node_modules"), "dir");
  const { createOgCache } = await import(pathToFileURL(path.join(source, "og-cache.mjs")));
  const directory = path.join(root, ".cache/docs-og");
  const workerUrl = pathToFileURL(path.join(source, "og-render-worker.mjs"));
  let renders = 0;
  const render = async (svg) => { renders++; return renderPng(svg, workerUrl); };
  const input = { title: "Guide", summary: "Set up your gateway", kicker: "Start" };
  let svg = renderPageOgSvg(input);
  const cold = createOgCache(directory, render);
  const original = await cold.render("guide", svg);
  const warm = createOgCache(directory, render);
  assert.deepEqual(await warm.render("guide", svg), original);
  assert.equal(renders, 1, "restoring a cache in a new build does not call the renderer");
  for (const changed of [
    { ...input, title: "Updated guide" },
    { ...input, summary: "Configure a remote gateway" },
    { ...input, kicker: "Reference" },
  ]) {
    svg = renderPageOgSvg(changed);
    const previousRenders = renders;
    assert.notDeepEqual(await warm.render("guide", svg), original);
    assert.equal(renders, previousRenders + 1);
  }
  fs.copyFileSync(path.join(source, "fonts/Switzer-Bold.otf"), path.join(source, "fonts/Switzer-Regular.otf"));
  const rendererChanged = createOgCache(directory, render);
  const beforeUpgrade = renders;
  const latest = await rendererChanged.render("guide", svg);
  assert.equal(renders, beforeUpgrade + 1);
  const file = path.join(directory, fs.readdirSync(directory)[0]);
  for (const damage of ["truncated JSON", "changed PNG", "missing PNG"]) {
    const entry = JSON.parse(fs.readFileSync(file, "utf8"));
    if (damage === "changed PNG") {
      const bytes = Buffer.from(entry.png, "base64");
      bytes[bytes.length - 20] ^= 1;
      entry.png = bytes.toString("base64");
    } else if (damage === "missing PNG") {
      delete entry.png;
    }
    fs.writeFileSync(file, damage === "truncated JSON" ? '{"input":' : JSON.stringify(entry));
    const beforeRepair = renders;
    assert.deepEqual(await rendererChanged.render("guide", svg), latest);
    assert.equal(renders, beforeRepair + 1, damage);
  }
  fs.rmSync(file);
  assert.deepEqual(await rendererChanged.render("guide", svg), latest, "an evicted entry is a cold render");
  await rendererChanged.render("removed-route", svg);
  const nextBuild = createOgCache(directory, render);
  await nextBuild.render("guide", svg);
  nextBuild.prune();
  assert.equal(fs.readdirSync(directory).length, 1, "only current selected routes remain cached");
});

test("warm builds keep current OG selection and refresh navigation-dependent cards", (t) => {
  const f = fixture(t, [], { "guide.md": '# Guide\n', "other.md": '# Other\n' });
  const config = (group, pages) => ({ name: "OG fixture", navigation: { languages: [
    { language: "en", tabs: [{ tab: "Docs", groups: [{ group, pages }] }] },
  ] } });
  const build = (env = {}) => {
    const result = f.build(env);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  const ogFile = path.join(f.root, "dist/docs-site/og/guide.png");
  const cacheDir = path.join(f.root, ".cache/docs-og");
  write(f.root, "docs/docs.json", JSON.stringify(config("Start", ["guide", "other"])));
  assert.match(build({ DOCS_SITE_RENDER_CACHE: "0" }), /og cache: disabled, 2 rendered/);
  assert.equal(fs.existsSync(cacheDir), false, "disabled builds do not create an OG cache");
  const uncached = fs.readFileSync(ogFile);
  assert.match(build(), /og cache: 0 reused, 2 rendered/);
  const first = fs.readFileSync(ogFile);
  assert.deepEqual(first, uncached);
  write(f.root, "docs/guide.md", '# Guide\n\nA body-only update.\n');
  assert.match(build(), /og cache: 2 reused, 0 rendered/);
  assert.deepEqual(fs.readFileSync(ogFile), first);
  const snapshot = () => fs.readdirSync(cacheDir).sort().map((file) => [file, fs.readFileSync(path.join(cacheDir, file))]);
  const cached = snapshot();
  write(f.root, "docs/docs.json", JSON.stringify(config("Reference", ["guide"])));
  assert.match(build({ DOCS_SITE_RENDER_CACHE: "0" }), /og cache: disabled, 1 rendered/);
  assert.notDeepEqual(fs.readFileSync(ogFile), first);
  assert.deepEqual(snapshot(), cached, "disabled builds neither update nor prune existing OG cache entries");
  assert.match(build(), /og cache: 0 reused, 1 rendered/);
  assert.notDeepEqual(fs.readFileSync(ogFile), first);
  assert.equal(fs.existsSync(path.join(f.root, "dist/docs-site/og/other.png")), false);
  assert.equal(fs.readdirSync(cacheDir).length, 1);
});

function renderPng(svg, workerUrl) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { workerData: { svg } });
    worker.once("message", (message) => message.error ? reject(new Error(message.error)) : resolve(Buffer.from(message.png)));
    worker.once("error", reject);
    worker.once("exit", (code) => { if (code) reject(new Error(`OG worker exited ${code}`)); });
  });
}
