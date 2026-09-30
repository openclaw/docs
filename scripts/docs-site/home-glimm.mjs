export function createHomeGlimm(load) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktopPointer = matchMedia("(min-width: 821px) and (hover: hover) and (pointer: fine)");
  let modulePromise;
  let glimm;
  let active;
  let preloadScheduled = false;

  function prepare() {
    if (!desktopPointer.matches || reducedMotion.matches || document.hidden) return Promise.resolve(null);
    return modulePromise ??= load().then((module) => glimm = module).catch(() => {
      modulePromise = null;
      return null;
    });
  }

  function cancel() {
    active?.finish();
  }

  function schedulePreload() {
    if (preloadScheduled || modulePromise || !desktopPointer.matches || reducedMotion.matches || document.hidden || document.readyState !== "complete") return;
    preloadScheduled = true;
    // Leave initial rendering and page assets alone; importing creates no GPU work.
    setTimeout(() => {
      const preload = () => { preloadScheduled = false; void prepare(); };
      if (window.requestIdleCallback) window.requestIdleCallback(preload, { timeout: 3000 });
      else setTimeout(preload, 1000);
    }, 1000);
  }

  function run(commit) {
    cancel();
    if (!glimm || !desktopPointer.matches || reducedMotion.matches || document.hidden) return Promise.resolve().then(commit);

    return new Promise((resolve, reject) => {
      let canvas, shader, sweep;
      let committed = false;
      let disposed = false;
      const swap = () => {
        if (committed) return;
        committed = true;
        try { commit(); resolve(); } catch (error) { reject(error); }
      };
      const task = { finish() {
        if (disposed) return;
        disposed = true;
        sweep?.cancel();
        shader?.destroy();
        canvas?.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
        canvas?.remove();
        if (active === task) active = null;
        swap();
      } };
      active = task;

      try {
        canvas = document.createElement("canvas");
        canvas.className = "docs-home-glimm";
        canvas.setAttribute("aria-hidden", "true");
        document.body.append(canvas);
        shader = glimm.createShader({ canvas });
        if (!shader) return task.finish();
        canvas.addEventListener("webglcontextlost", task.finish, { once: true });
        const brand = getComputedStyle(document.body).getPropertyValue("--brand").trim();
        const light = document.documentElement.dataset.theme === "light";
        // Keep the dark sweep coral, without the shader's white specular highlight.
        sweep = glimm.playSweep(shader, {
          palette: light ? glimm.accentPair(brand, "#ffd4c7") : glimm.accentPair("#a83e30", "#d46148"),
          easing: "easeOutQuart", sweepMs: 400, outroMs: 160,
          midpoint: .48, peakAlpha: light ? .45 : .22, bandTight: 16,
          brightness: light ? 1 : .55,
          waveAmount: .5, rippleAmount: .2, swellAmount: light ? .25 : 0,
          direction: document.documentElement.dir === "rtl" ? "rtl" : "ltr",
          onMidpoint: swap,
        });
        sweep.done.then(task.finish, task.finish);
      } catch { task.finish(); }
    });
  }

  if (document.readyState === "complete") schedulePreload();
  else window.addEventListener("load", schedulePreload, { once: true });
  reducedMotion.addEventListener("change", () => { cancel(); schedulePreload(); });
  desktopPointer.addEventListener("change", () => { cancel(); schedulePreload(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancel();
    else if (document.readyState === "complete") schedulePreload();
  });
  window.addEventListener("pagehide", cancel);
  return { run, cancel };
}
