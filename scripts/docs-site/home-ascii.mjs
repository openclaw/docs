const columns = 220;
const rows = 16;

export function homeAsciiGlyph(column, row) {
  let value = Math.imul(column + 1, 374761393) + Math.imul(row + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  const grain = ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  if (grain > .76 - row * .025) return " ";
  return grain < .16 ? ":" : grain < .34 ? "+" : ".";
}

// A fixed grain field keeps the decorative texture stable across page loads.
const lines = Array.from({ length: rows }, (_, row) =>
  Array.from({ length: columns }, (_, column) => homeAsciiGlyph(column, row)).join(""),
);

export const homeAsciiArt = `<div class="home-ascii" aria-hidden="true" data-pagefind-ignore><svg viewBox="0 0 1760 128" preserveAspectRatio="none" focusable="false"><text fill="currentColor" font-family="monospace" font-size="9" xml:space="preserve">${lines.map((line, row) => `<tspan x="0" y="${row * 8 + 8}" textLength="1760" lengthAdjust="spacingAndGlyphs">${line}</tspan>`).join("")}</text></svg></div>`;

export function mountHomeAscii(host) {
  if (!host) return () => {};
  const svg = host.querySelector("svg");
  const media = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const active = new Set();
  let particles = [];
  let frame = 0;
  let previousTime = 0;
  let visible = true;
  let width = 0;

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    for (const particle of particles) {
      if (!particle.x && !particle.y && !particle.tx && !particle.ty) continue;
      particle.x = particle.y = particle.vx = particle.vy = particle.tx = particle.ty = 0;
      particle.node.style.removeProperty("transform");
    }
    active.clear();
  }

  function resize() {
    const main = host.parentElement.getBoundingClientRect();
    const rtl = getComputedStyle(host).direction === "rtl";
    const gutter = rtl ? main.left : document.documentElement.clientWidth - main.right;
    host.style.insetInlineEnd = -Math.max(0, gutter) + "px";
    const nextWidth = host.clientWidth;
    if (nextWidth === width) return;
    width = nextWidth;
    reset();
    svg.setAttribute("viewBox", "0 0 " + width + " 128");
    const fragment = document.createDocumentFragment();
    particles = [];
    for (let row = 0; row < 16; row++) {
      for (let column = 0; column < Math.ceil(width / 8); column++) {
        const glyph = homeAsciiGlyph(column, row);
        if (glyph === " ") continue;
        const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const ox = column * 8;
        const oy = row * 8 + 8;
        node.setAttribute("x", ox);
        node.setAttribute("y", oy);
        node.textContent = glyph;
        fragment.append(node);
        particles.push({ node, ox, oy, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
      }
    }
    svg.replaceChildren(fragment);
  }

  function animate(time) {
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, .032) : 1 / 60;
    previousTime = time;
    const steps = Math.ceil(elapsed / (1 / 120));
    const dt = elapsed / steps;
    // A small spring retains velocity when the cursor reverses direction.
    for (const p of active) {
      for (let step = 0; step < steps; step++) {
        p.vx += ((p.tx - p.x) * 100 - p.vx * 10) * dt;
        p.vy += ((p.ty - p.y) * 100 - p.vy * 10) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (Math.abs(p.x - p.tx) + Math.abs(p.y - p.ty) < .02 && Math.abs(p.vx) + Math.abs(p.vy) < .05) {
        p.x = p.tx;
        p.y = p.ty;
        p.vx = p.vy = 0;
        active.delete(p);
      }
      if (p.x || p.y) p.node.style.transform = "translate(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px)";
      else p.node.style.removeProperty("transform");
    }
    frame = active.size ? requestAnimationFrame(animate) : 0;
    if (!frame) previousTime = 0;
  }

  function start() {
    if (!frame && active.size) frame = requestAnimationFrame(animate);
  }

  function release() {
    for (const p of particles) {
      if (!p.tx && !p.ty) continue;
      p.tx = p.ty = 0;
      active.add(p);
    }
    start();
  }

  function move(event) {
    if (!media.matches || !visible || document.hidden || event.pointerType !== "mouse") return;
    const bounds = host.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom || event.target.closest(".site-header,.sidebar,.search-modal,.mermaid-overlay")) {
      release();
      return;
    }
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (const p of particles) {
      const dx = p.ox + 2 - x;
      const dy = p.oy - 3 - y;
      const distance = Math.hypot(dx, dy);
      const force = distance < 72 ? 14 * (1 - distance / 72) ** 2 : 0;
      const tx = force * dx / Math.max(distance, .01);
      const ty = force * dy / Math.max(distance, .01);
      if (tx === p.tx && ty === p.ty) continue;
      p.tx = tx;
      p.ty = ty;
      active.add(p);
    }
    start();
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) reset();
  });
  observer.observe(host);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host.parentElement);
  resize();
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerleave", release);
  document.addEventListener("visibilitychange", reset);
  window.addEventListener("blur", release);
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", reset, { passive: true });
  media.addEventListener("change", reset);
  return () => {
    reset();
    observer.disconnect();
    sizeObserver.disconnect();
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerleave", release);
    document.removeEventListener("visibilitychange", reset);
    window.removeEventListener("blur", release);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", reset);
    media.removeEventListener("change", reset);
  };
}
